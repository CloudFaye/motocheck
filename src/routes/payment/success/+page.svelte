<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<Card.Root class="max-w-md w-full p-8 text-center space-y-6">
		<div class="space-y-2">
			<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
				<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold">Payment Successful!</h1>
			<p class="text-muted-foreground">
				Your report is being generated and will be sent to your email shortly.
			</p>
		</div>

		<div class="space-y-3">
			<p class="text-sm text-muted-foreground">
				Check your inbox for the detailed PDF report. It may take a few minutes to arrive.
			</p>
			<Button href="/" class="w-full">Check Another VIN</Button>
		</div>
	</Card.Root>
</div>
