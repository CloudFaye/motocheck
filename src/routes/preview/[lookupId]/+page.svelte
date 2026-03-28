<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { formatCurrency } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const historyItems = [
		{ 
			icon: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>', 
			label: 'Ownership History', 
			status: 'No Records Reported', 
			available: false 
		},
		{ 
			icon: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>', 
			label: 'Service Records', 
			status: 'No Records Reported', 
			available: false 
		},
		{ 
			icon: '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>', 
			label: 'Accident History', 
			status: 'No Records Reported', 
			available: true 
		},
		{ 
			icon: '<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>', 
			label: 'Insurance Records', 
			status: 'No Records Reported', 
			available: false 
		},
		{ 
			icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>', 
			label: 'Title History', 
			status: 'No Records Reported', 
			available: false 
		},
		{ 
			icon: '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', 
			label: 'Sale History', 
			status: 'No Records Reported', 
			available: false 
		}
	];
</script>

<div class="min-h-screen bg-muted/30">
	<!-- Header -->
	<div class="bg-background border-b">
		<div class="max-w-5xl mx-auto px-4 py-4 md:py-6">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 class="text-xl md:text-2xl font-bold">Vehicle History Report For</h1>
					<p class="text-sm md:text-base text-muted-foreground font-mono break-all">VIN# {data.vin}</p>
				</div>
				<Badge variant="outline" class="text-green-600 border-green-600 w-fit">
					<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
					</svg>
					CLEARVIN
				</Badge>
			</div>
		</div>
	</div>

	<div class="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
		<!-- Vehicle Card with Image -->
		<Card.Root class="overflow-hidden">
			<div class="grid md:grid-cols-2 gap-6 p-6">
				<div class="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
					<div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
					<svg class="w-32 h-32 text-primary/20 relative z-10" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
					</svg>
					<div class="absolute bottom-4 left-4 bg-background px-3 py-1 rounded text-sm font-medium">
						Preview Only
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<h2 class="text-2xl font-bold">{data.year} {data.make} {data.model}</h2>
						<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
							<span>Report ID: PREVIEW-MODE</span>
							<span>•</span>
							<span>Date: {new Date().toLocaleDateString()}</span>
						</div>
					</div>

					<div class="border-t my-4"></div>

					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Engine</span>
							<span class="font-medium">{data.engine}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Origin</span>
							<span class="font-medium">{data.plantCountry}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Fuel Type</span>
							<span class="font-medium">{data.fuelType}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Body Class</span>
							<span class="font-medium">{data.bodyClass}</span>
						</div>
					</div>

					<div class="pt-4">
						<div class="flex items-center justify-center gap-2 mb-2">
							<div class="w-24 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
						</div>
						<p class="text-center text-sm">
							<span class="font-semibold">ClearVin Vehicle Rating:</span> Checking...
						</p>
					</div>
				</div>
			</div>
		</Card.Root>

		<!-- History Grid -->
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			{#each historyItems as item}
				<Card.Root class="p-4 text-center space-y-2 relative">
					<div class={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${item.available ? 'bg-green-100' : 'bg-red-100'}`}>
						<svg class="w-3 h-3 {item.available ? 'text-green-600' : 'text-red-600'}" fill="currentColor" viewBox="0 0 20 20">
							{#if item.available}
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							{:else}
								<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
							{/if}
						</svg>
					</div>
					<div class="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
						<svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
							{@html item.icon}
						</svg>
					</div>
					<div class="text-sm font-medium">{item.label}</div>
					<div class="text-xs text-muted-foreground">{item.status}</div>
				</Card.Root>
			{/each}
		</div>

		<!-- Vehicle Specifications -->
		<Card.Root>
			<div class="p-6 space-y-4">
				<h3 class="text-lg font-semibold border-l-4 border-primary pl-3">Vehicle Specifications</h3>
				
				<div class="grid md:grid-cols-2 gap-x-12 gap-y-4">
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">VIN:</span>
						<span class="font-mono font-medium">{data.vin}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Make:</span>
						<span class="font-medium">{data.make}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Model:</span>
						<span class="font-medium">{data.model}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Year:</span>
						<span class="font-medium">{data.year}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Engine:</span>
						<span class="font-medium">{data.engine}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Body Class:</span>
						<span class="font-medium">{data.bodyClass}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Fuel Type:</span>
						<span class="font-medium">{data.fuelType}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Origin:</span>
						<span class="font-medium">{data.plantCountry}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Valuation Confidence:</span>
						<Badge variant={data.confidence === 'exact' ? 'default' : 'secondary'}>
							{data.confidence}
						</Badge>
					</div>
				</div>
			</div>
		</Card.Root>

		<!-- Import Duty Estimate -->
		<Card.Root class="bg-gradient-to-br from-primary/5 to-background">
			<div class="p-6 space-y-4">
				<div class="flex items-start justify-between">
					<div class="space-y-2">
						<h3 class="text-lg font-semibold">Estimated Import Duty</h3>
						<p class="text-3xl font-bold">{formatCurrency(data.dutyEstimate)}</p>
						<p class="text-sm text-muted-foreground">
							Based on NCS valuation and current CBN rates
						</p>
					</div>
					<div class="text-right">
						<Badge variant="outline" class="mb-2">{data.confidence} match</Badge>
					</div>
				</div>

				<div class="bg-muted/50 rounded-lg p-4 space-y-2">
					<p class="text-sm font-medium">💡 What's included in the full report:</p>
					<ul class="text-sm text-muted-foreground space-y-1">
						<li>✓ Complete duty breakdown (Import Duty, Surcharge, NAC Levy, CISS, ETLS, VAT)</li>
						<li>✓ NCS valuation details with confidence level</li>
						<li>✓ Current CBN exchange rates</li>
						<li>✓ Official documentation for customs clearance</li>
					</ul>
				</div>
			</div>
		</Card.Root>

		<!-- CTA Card -->
		<Card.Root class="bg-amber-50 border-amber-200">
			<div class="p-6 text-center space-y-4">
				<h3 class="text-xl font-semibold">Full History Analysis Available</h3>
				<p class="text-muted-foreground">
					Unlock the complete duty breakdown, NCS valuation, and official documentation
				</p>
				<div class="flex items-center justify-center gap-6 py-4">
					<div>
						<p class="text-3xl font-bold">₦5,000</p>
						<p class="text-sm text-muted-foreground">One-time payment</p>
					</div>
				</div>
				<Button size="lg" class="bg-green-600 hover:bg-green-700 h-12 px-8" href={`/checkout/${data.lookupId}`}>
					Unlock Full Report
				</Button>
			</div>
		</Card.Root>
	</div>
</div>
