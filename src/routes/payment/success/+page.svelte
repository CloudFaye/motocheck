<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="flex min-h-screen items-center justify-center bg-white p-4">
	<div class="card w-full max-w-md space-y-6 p-8 text-center">
		<div class="space-y-2">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
				<svg class="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<h1 class="font-display text-2xl text-ink">Payment Successful!</h1>
			<p class="tracking-wide text-ink-muted">
				Your report request has been accepted and processing has started.
			</p>
		</div>

		<div class="space-y-3">
			<p class="text-sm tracking-wide text-ink-faint">
				Check your inbox for delivery updates. Depending on source availability, report generation
				can take a few minutes.
			</p>
			<a href={resolve('/')} class="btn-gold inline-flex w-full items-center justify-center py-4"
				>Check Another VIN</a
			>
		</div>
	</div>
</div>
