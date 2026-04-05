# Bugfix Requirements Document

## Introduction

This document specifies the requirements for fixing the pg-boss queue initialization bug where queues don't exist when workers try to use them. The bug affects all 13 worker queues in the vehicle history pipeline, causing webhook enqueue operations and worker job fetching to fail with "Queue [name] does not exist" errors.

In pg-boss 12.x, calling `queue.work()` does not automatically create queues - they must be explicitly created using `queue.createQueue()` before any queue operations can succeed.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the worker process starts and calls `queue.work(queueName, handler)` for any of the 13 queues THEN the system does not create the queue in pg-boss

1.2 WHEN the webhook receives a payment success event and calls `queue.send(queueName, jobData)` THEN the system throws "Queue [name] does not exist" error

1.3 WHEN workers attempt to fetch jobs from queues that were never created THEN the system continuously errors with "Queue does not exist" messages

1.4 WHEN any code attempts to enqueue jobs to the 13 worker queues (fetch-nhtsa-decode, fetch-nhtsa-recalls, fetch-nmvtis, fetch-nicb, scrape-copart, scrape-iaai, scrape-autotrader, scrape-cargurus, normalize, stitch-report, llm-analyze, llm-write-sections, email-report) THEN the system fails because queues were never initialized

### Expected Behavior (Correct)

2.1 WHEN the worker process starts THEN the system SHALL explicitly create all 13 queues using `queue.createQueue()` before registering workers

2.2 WHEN the webhook receives a payment success event and calls `queue.send(queueName, jobData)` THEN the system SHALL successfully enqueue the job without errors

2.3 WHEN workers attempt to fetch jobs from queues THEN the system SHALL successfully retrieve jobs without "Queue does not exist" errors

2.4 WHEN any code attempts to enqueue jobs to the 13 worker queues THEN the system SHALL successfully enqueue jobs because queues exist

### Unchanged Behavior (Regression Prevention)

3.1 WHEN workers process jobs after the fix THEN the system SHALL CONTINUE TO execute the same job handler logic without modification

3.2 WHEN the queue singleton is initialized via `getQueue()` THEN the system SHALL CONTINUE TO return the same pg-boss instance with the same configuration (retry limits, expiration, retention)

3.3 WHEN graceful shutdown is triggered (SIGTERM/SIGINT) THEN the system SHALL CONTINUE TO allow current jobs to complete before exiting

3.4 WHEN heartbeat logging runs every 60 seconds THEN the system SHALL CONTINUE TO log queue status without modification

3.5 WHEN job retry logic is triggered THEN the system SHALL CONTINUE TO use the existing retry configuration (3 attempts with exponential backoff)
