<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
</script>

<div class="min-h-screen bg-muted/30">
	<div class="bg-background border-b">
		<div class="max-w-7xl mx-auto px-4 py-6">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 class="text-2xl md:text-3xl font-bold">Sample Report</h1>
					<p class="text-muted-foreground mt-1">See what you'll get with your VIN check</p>
				</div>
				<Button href="/" size="lg" class="h-12 px-6">Check Your VIN</Button>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 py-8">
		<Card.Root class="overflow-hidden">
			<!-- Desktop: object tag -->
			<div class="hidden md:block">
				<object
					data="/docs/sample-report.pdf"
					type="application/pdf"
					class="w-full"
					style="height: calc(100vh - 200px); min-height: 600px;"
					title="Sample VIN Report"
				>
					<div class="p-8 text-center space-y-4">
						<p class="text-muted-foreground">Unable to display PDF in browser</p>
						<Button onclick={() => window.open('/docs/sample-report.pdf', '_blank')}>
							Download PDF Instead
						</Button>
					</div>
				</object>
			</div>

			<!-- Mobile: Download button -->
			<div class="md:hidden p-8 text-center space-y-6">
				<div class="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold mb-2">Sample Report</h3>
					<p class="text-muted-foreground mb-4">
						View the complete example of our detailed vehicle import duty report
					</p>
				</div>
				<Button size="lg" class="w-full h-12" onclick={() => window.open('/docs/sample-report.pdf', '_blank')}>
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					Open PDF Report
				</Button>
			</div>
		</Card.Root>
	</div>
</div>
