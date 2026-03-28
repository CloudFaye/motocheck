<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { sanitizeVIN, getVINError } from '$lib/vin-validator';
	import { toast } from 'svelte-sonner';

	let vin = $state('');
	let loading = $state(false);

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		vin = sanitizeVIN(input.value);
	}

	async function handleSubmit() {
		const validationError = getVINError(vin);
		if (validationError) {
			toast.error('Invalid VIN', { description: validationError });
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/vin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vin })
			});

			if (!res.ok) {
				const data = await res.json();
				toast.error(data.error || 'Vin not found. Unable to generate report.');
				loading = false;
				return;
			}

			const data = await res.json();
			goto(`/preview/${data.lookupId}`);
		} catch (e) {
			toast.error('Network Error', { description: 'Please check your connection and try again.' });
			loading = false;
		}
	}
</script>

{#if loading}
	<div class="fixed inset-0 bg-background z-50 flex items-center justify-center">
		<div class="text-center space-y-6 max-w-md px-4">
			<div class="relative w-24 h-24 mx-auto">
				<div class="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
				<div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
			<div class="space-y-2">
				<h2 class="text-2xl font-bold">Analyzing VIN...</h2>
				<p class="text-muted-foreground">Fetching vehicle data from NHTSA database</p>
			</div>
			<div class="space-y-2 text-sm text-muted-foreground">
				<p class="flex items-center justify-center gap-2">
					<span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
					Decoding vehicle specifications
				</p>
				<p class="flex items-center justify-center gap-2">
					<span class="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></span>
					Calculating import duties
				</p>
				<p class="flex items-center justify-center gap-2">
					<span class="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></span>
					Preparing your report
				</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen">
	<!-- Hero Section with Inline VIN Check -->
	<section class="relative py-12 md:py-20 px-4 overflow-hidden">
		<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background"></div>
		<div class="max-w-6xl mx-auto relative">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div class="space-y-8">
					<div class="space-y-4">
						<h1 class="text-4xl md:text-5xl  font-bold tracking-tight leading-tight">
							Know Your Import Costs Before You Buy
						</h1>
						<p class=" text-[16px] text-muted-foreground">
							Get instant, accurate Nigerian import duty estimates for any vehicle. Make informed decisions with detailed breakdowns and official NCS valuations.
						</p>
					</div>

					<!-- Premium VIN Input -->
					<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
						<div class="space-y-2">
							<Label for="vin" class="text-base font-medium">Enter Your 17-Character VIN</Label>
							<div class="relative">
								<Input
									id="vin"
									value={vin}
									oninput={handleInput}
									placeholder="1HGBH41JXMN109186"
									maxlength={17}
									disabled={loading}
									class="font-mono uppercase text-base h-14 px-4 pr-16 tracking-wider"
								/>
								<div class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium {vin.length === 17 ? 'text-green-600' : 'text-muted-foreground'}">
									{vin.length}/17
								</div>
							</div>
							<p class="text-sm text-muted-foreground">Found on your dashboard or registration document</p>
						</div>
						<Button type="submit" size="lg" class="w-full h-14 text-base font-medium" disabled={loading || vin.length !== 17}>
							{loading ? 'Analyzing VIN...' : 'Get Duty Report →'}
						</Button>
					</form>

				
				</div>
				<div class="relative order-first lg:order-last">
					<img 
						src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80" 
						alt="Luxury vehicle dashboard" 
						class="w-full h-auto rounded-2xl border"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-12 md:py-20 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold mb-4">Everything You Need to Know</h2>
				<p class="text-muted-foreground">Comprehensive vehicle import duty reports in minutes</p>
			</div>
			<div class="grid md:grid-cols-3 gap-6 md:gap-8">
				<Card.Root class="p-6">
					<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">Accurate Calculations</h3>
					<p class="text-muted-foreground">
						Based on official NCS valuation tables and current CBN exchange rates. All 7 duty components included.
					</p>
				</Card.Root>

				<Card.Root class="p-6">
					<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">Instant Results</h3>
					<p class="text-muted-foreground">
						Get your detailed PDF report delivered to your email within minutes of payment confirmation.
					</p>
				</Card.Root>

				<Card.Root class="p-6">
					<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">Detailed Breakdown</h3>
					<p class="text-muted-foreground">
						Complete duty breakdown including Import Duty, Surcharge, NAC Levy, CISS, ETLS, and VAT.
					</p>
				</Card.Root>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section class="py-12 md:py-20 px-4 bg-muted/30" id="how-it-works">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold mb-4">How It Works</h2>
				<p class="text-muted-foreground">Get your report in 3 simple steps</p>
			</div>
			<div class="grid md:grid-cols-3 gap-8">
				<div class="text-center space-y-4">
					<div class="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
						1
					</div>
					<h3 class="text-xl font-semibold">Enter VIN</h3>
					<p class="text-muted-foreground">
						Paste your 17-character Vehicle Identification Number
					</p>
				</div>
				<div class="text-center space-y-4">
					<div class="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
						2
					</div>
					<h3 class="text-xl font-semibold">Review & Pay</h3>
					<p class="text-muted-foreground">
						See vehicle details and duty estimate, then purchase full report
					</p>
				</div>
				<div class="text-center space-y-4">
					<div class="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
						3
					</div>
					<h3 class="text-xl font-semibold">Get Report</h3>
					<p class="text-muted-foreground">
						Receive detailed PDF report via email instantly
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-12 md:py-20 px-4 bg-primary text-primary-foreground">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<h2 class="text-3xl md:text-4xl font-bold">Ready to Check Your Vehicle?</h2>
			<p class="text-lg md:text-xl opacity-90">
				Join thousands of smart importers who make informed decisions
			</p>
			<Button size="lg" variant="secondary" href="/#check-vin" class="h-12 px-8">
				Get Started Now
			</Button>
		</div>
	</section>
</div>
