# Queue Initialization Bug Fix Design

## Overview

This design addresses a critical bug in the pg-boss queue initialization where queues don't exist when workers attempt to use them. In pg-boss 12.x, calling `queue.work()` does not automatically create queues - they must be explicitly created using `queue.createQueue()` before any queue operations (send, work, fetch) can succeed.

The fix involves adding explicit queue creation for all 13 worker queues during the worker process startup, before worker registration. This ensures queues exist when webhook endpoints enqueue jobs and when workers attempt to fetch jobs.

The solution is minimal and surgical: add a single initialization function that creates all queues, call it once during startup, and leave all existing worker logic unchanged.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when any code attempts to enqueue jobs or workers attempt to fetch jobs from queues that were never explicitly created
- **Property (P)**: The desired behavior - queues must exist before any queue operations, allowing successful job enqueuing and worker processing
- **Preservation**: All existing worker handler logic, job retry configuration, graceful shutdown, heartbeat logging, and queue singleton behavior must remain unchanged
- **getQueue()**: The function in `src/lib/server/queue/index.ts` that returns the pg-boss singleton instance
- **registerAllWorkers()**: The function in `workers/index.ts` that registers all 13 worker handlers with pg-boss
- **queue.work()**: pg-boss method that registers a worker handler for a queue (does NOT create the queue in 12.x)
- **queue.createQueue()**: pg-boss method that explicitly creates a queue in the database
- **queue.send()**: pg-boss method that enqueues a job (fails if queue doesn't exist)

## Bug Details

### Bug Condition

The bug manifests when the worker process starts and registers workers using `queue.work()`, or when any code attempts to enqueue jobs using `queue.send()`. In pg-boss 12.x, `queue.work()` does not automatically create queues, so queues never exist in the database. When webhook endpoints or workers attempt queue operations, they fail with "Queue [name] does not exist" errors.

**Formal Specification:**
```
FUNCTION isBugCondition(operation)
  INPUT: operation of type QueueOperation { type: 'send' | 'work' | 'fetch', queueName: string }
  OUTPUT: boolean
  
  RETURN operation.queueName IN [
           'fetch-nhtsa-decode', 'fetch-nhtsa-recalls', 'fetch-nmvtis', 'fetch-nicb',
           'scrape-copart', 'scrape-iaai', 'scrape-autotrader', 'scrape-cargurus',
           'normalize', 'stitch-report', 'llm-analyze', 'llm-write-sections'
         ]
         AND queueNotExplicitlyCreated(operation.queueName)
         AND (operation.type == 'send' OR operation.type == 'fetch')
END FUNCTION
```

### Examples

- **Webhook enqueue failure**: User completes payment, webhook receives success event, calls `queue.send('fetch-nhtsa-decode', { vin })`, system throws "Queue fetch-nhtsa-decode does not exist"
- **Worker fetch failure**: Worker process starts, registers handler with `queue.work('fetch-nhtsa-decode', handler)`, worker attempts to fetch jobs, system throws "Queue fetch-nhtsa-decode does not exist"
- **Normalizer enqueue failure**: NHTSA decode fetcher completes successfully, calls `queue.send('normalize', { vin, source })`, system throws "Queue normalize does not exist"
- **All 13 queues affected**: Every queue in the system (fetch-nhtsa-decode, fetch-nhtsa-recalls, fetch-nmvtis, fetch-nicb, scrape-copart, scrape-iaai, scrape-autotrader, scrape-cargurus, normalize, stitch-report, llm-analyze, llm-write-sections) fails with the same error

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All worker handler logic must continue to execute exactly as before (no changes to job processing)
- Queue singleton configuration must remain unchanged (retry limits, expiration, retention, connection pool)
- Graceful shutdown behavior must continue to allow current jobs to complete before exiting
- Heartbeat logging must continue to run every 60 seconds without modification
- Job retry logic must continue to use existing configuration (3 attempts with exponential backoff)
- Worker registration order and logging must remain unchanged
- All queue.send() calls throughout the codebase must continue to work with the same parameters

**Scope:**
All code that does NOT involve queue creation should be completely unaffected by this fix. This includes:
- Worker handler implementations (all 13 workers)
- Job enqueuing logic in webhooks and workers
- Queue configuration in getQueue()
- Graceful shutdown handlers
- Heartbeat logging
- Error handling and logging

## Hypothesized Root Cause

Based on the bug description and pg-boss 12.x behavior, the root cause is:

1. **Missing Explicit Queue Creation**: pg-boss 12.x changed behavior from earlier versions - `queue.work()` no longer automatically creates queues. Queues must be explicitly created using `queue.createQueue()` before any operations.

2. **Worker Registration Timing**: The worker process calls `queue.work()` for all 13 queues during startup, but this only registers handlers - it doesn't create the queues in the database.

3. **Enqueue Operations Fail**: When webhook endpoints or workers call `queue.send()`, pg-boss checks if the queue exists in the database. Since queues were never created, all enqueue operations fail.

4. **Worker Fetch Operations Fail**: When workers attempt to fetch jobs from queues, pg-boss checks if the queue exists. Since queues were never created, workers continuously error.

## Correctness Properties

Property 1: Bug Condition - Queue Operations Succeed After Explicit Creation

_For any_ queue operation (send, work, fetch) where the queue name is one of the 13 worker queues and the queue has been explicitly created using `queue.createQueue()`, the operation SHALL succeed without "Queue does not exist" errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Worker Logic Unchanged

_For any_ worker handler function, the fixed code SHALL execute the same job processing logic as the original code, preserving all existing behavior for job handling, error handling, logging, and downstream job enqueuing.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `workers/index.ts`

**Function**: New function `initializeQueues()` + modification to `main()`

**Specific Changes**:

1. **Add Queue Initialization Function**: Create a new async function `initializeQueues()` that explicitly creates all 13 queues using `queue.createQueue(queueName)`
   - Import Jobs constant from job-names.ts
   - Get queue instance using getQueue()
   - Call queue.createQueue() for each of the 13 queue names
   - Log success message after all queues are created
   - Handle errors and exit with code 1 if creation fails

2. **Call Initialization Before Worker Registration**: In the `main()` function, call `await initializeQueues()` BEFORE calling `await registerAllWorkers()`
   - This ensures queues exist before workers are registered
   - Maintains clean separation: create queues first, then register handlers

3. **Add Logging**: Log queue creation progress to match existing logging style
   - Log start of queue initialization
   - Log success after all queues created
   - Log errors if creation fails

4. **Error Handling**: If queue creation fails, log error and exit with code 1
   - Consistent with existing error handling in registerAllWorkers()
   - Prevents worker process from running with missing queues

5. **No Changes to Existing Functions**: Do not modify registerAllWorkers(), worker handlers, or any other existing code
   - This is a pure addition, not a refactor
   - Minimizes risk of introducing regressions

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to enqueue jobs to queues before explicit creation. Run these tests on the UNFIXED code to observe "Queue does not exist" errors and confirm the root cause.

**Test Cases**:
1. **Webhook Enqueue Test**: Start worker process, attempt to enqueue job from webhook endpoint (will fail on unfixed code with "Queue fetch-nhtsa-decode does not exist")
2. **Worker Fetch Test**: Start worker process, observe worker logs for "Queue does not exist" errors when attempting to fetch jobs (will fail on unfixed code)
3. **Normalizer Enqueue Test**: Simulate fetcher completion, attempt to enqueue normalize job (will fail on unfixed code with "Queue normalize does not exist")
4. **All Queues Test**: Verify all 13 queues fail with the same error pattern (will fail on unfixed code)

**Expected Counterexamples**:
- "Queue [name] does not exist" errors when calling queue.send()
- "Queue [name] does not exist" errors in worker logs when attempting to fetch jobs
- Possible causes: queue.work() doesn't create queues, missing explicit queue.createQueue() calls

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL queueOperation WHERE isBugCondition(queueOperation) DO
  result := executeQueueOperation_fixed(queueOperation)
  ASSERT result.success == true
  ASSERT result.error == null
END FOR
```

**Test Plan**: After implementing the fix, verify that:
1. Worker process starts successfully and logs "Successfully created 13 queues"
2. Webhook endpoints can enqueue jobs without errors
3. Workers can fetch and process jobs without errors
4. All 13 queues exist in the pg-boss database tables

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL workerJob WHERE NOT isBugCondition(workerJob) DO
  ASSERT workerHandler_original(workerJob) = workerHandler_fixed(workerJob)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for worker job processing, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Worker Handler Preservation**: Verify all 13 worker handlers execute the same logic after fix (same database operations, same logging, same downstream job enqueuing)
2. **Queue Configuration Preservation**: Verify queue singleton configuration remains unchanged (retry limits, expiration, retention)
3. **Graceful Shutdown Preservation**: Verify SIGTERM/SIGINT handlers continue to allow current jobs to complete
4. **Heartbeat Preservation**: Verify heartbeat logging continues every 60 seconds with same format

### Unit Tests

- Test initializeQueues() function creates all 13 queues
- Test initializeQueues() handles errors and exits with code 1
- Test main() calls initializeQueues() before registerAllWorkers()
- Test queue.send() succeeds after queue creation
- Test worker handlers continue to process jobs correctly

### Property-Based Tests

- Generate random VIN inputs and verify workers process jobs identically before and after fix
- Generate random job payloads and verify queue.send() succeeds for all 13 queues
- Test that worker registration order doesn't affect queue creation success

### Integration Tests

- Test full pipeline flow: webhook enqueue → worker fetch → job processing → downstream enqueue
- Test worker process startup with all 13 queues
- Test graceful shutdown with queued jobs
- Test heartbeat logging continues during job processing
