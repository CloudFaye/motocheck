<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency } from '$lib/utils';
	import { EMAIL_REGEX, REPORT_PRICE_NGN } from '$lib/constants';

	let { data } = $props();

	let email = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleCheckout() {
		if (!email || !EMAIL_REGEX.test(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/pay/initiate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lookupId: data.lookupId, email, source: 'web' })
			});

			if (!res.ok) {
				const data = await res.json();
				error = data.error || 'Payment initiation failed';
				loading = false;
				return;
			}

			const { paymentUrl } = await res.json();
			window.location.href = paymentUrl;
		} catch {
			error = 'Network error. Please try again.';
			loading = false;
		}
	}
</script>

{#if loading}
	<div class="fixed inset-0 bg-background z-50 flex items-center justify-center">
		<div class="text-center space-y-4">
			<div class="relative w-16 h-16 mx-auto">
				<div class="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
				<div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
			<p class="text-lg font-medium">Redirecting to payment...</p>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-muted/30">
	<div class="bg-background border-b">
		<div class="max-w-4xl mx-auto px-4 py-6">
			<Button href={`/preview/${data.lookupId}`} variant="ghost" size="sm" class="mb-4">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
				</svg>
				Back to Preview
			</Button>
			<h1 class="text-2xl md:text-3xl font-bold">Complete Your Purchase</h1>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 py-8">
		<div class="grid lg:grid-cols-5 gap-8">
			<!-- Order Summary -->
			<div class="lg:col-span-3 space-y-6">
				<Card.Root>
					<div class="p-6 space-y-4">
						<h2 class="text-lg font-semibold">Vehicle Details</h2>
						<div class="space-y-3">
							<div>
								<h3 class="text-2xl font-bold">{data.year} {data.make} {data.model}</h3>
								<p class="text-sm text-muted-foreground font-mono mt-1">VIN: {data.vin}</p>
							</div>
							<Separator />
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p class="text-muted-foreground">Engine</p>
									<p class="font-medium">{data.engine}</p>
								</div>
								<div>
									<p class="text-muted-foreground">Body Class</p>
									<p class="font-medium">{data.bodyClass}</p>
								</div>
								<div>
									<p class="text-muted-foreground">Fuel Type</p>
									<p class="font-medium">{data.fuelType}</p>
								</div>
								<div>
									<p class="text-muted-foreground">Origin</p>
									<p class="font-medium">{data.plantCountry}</p>
								</div>
							</div>
						</div>
					</div>
				</Card.Root>

				<Card.Root>
					<div class="p-6 space-y-4">
						<h2 class="text-lg font-semibold">What You'll Get</h2>
						<ul class="space-y-3">
							<li class="flex gap-3">
								<svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								<div>
									<p class="font-medium">Complete Duty Breakdown</p>
									<p class="text-sm text-muted-foreground">All 7 components itemized with calculations</p>
								</div>
							</li>
							<li class="flex gap-3">
								<svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								<div>
									<p class="font-medium">Official NCS Valuation</p>
									<p class="text-sm text-muted-foreground">Vehicle value used for duty calculation</p>
								</div>
							</li>
							<li class="flex gap-3">
								<svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								<div>
									<p class="font-medium">Downloadable PDF Report</p>
									<p class="text-sm text-muted-foreground">Sent to your email instantly</p>
								</div>
							</li>
						</ul>
					</div>
				</Card.Root>
			</div>

			<!-- Payment Form -->
			<div class="lg:col-span-2">
				<div class="lg:sticky lg:top-6 space-y-6">
					<Card.Root>
						<div class="p-6 space-y-4">
							<h2 class="text-lg font-semibold">Order Summary</h2>
							<div class="space-y-3">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Report Fee</span>
									<span class="font-medium">{formatCurrency(REPORT_PRICE_NGN)}</span>
								</div>
								<Separator />
								<div class="flex justify-between">
									<span class="font-semibold">Total</span>
									<span class="text-2xl font-bold text-primary">{formatCurrency(REPORT_PRICE_NGN)}</span>
								</div>
							</div>
						</div>
					</Card.Root>

					<Card.Root>
						<form onsubmit={(e) => { e.preventDefault(); handleCheckout(); }} class="p-6 space-y-4">
							<div class="space-y-2">
								<Label for="email" class="text-base font-medium">Email Address</Label>
								<Input
									id="email"
									type="email"
									bind:value={email}
									placeholder="your@email.com"
									disabled={loading}
									class="h-12"
									required
								/>
								<p class="text-sm text-muted-foreground">Report will be sent to this email</p>
							</div>

							{#if error}
								<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
									<p class="text-sm text-destructive">{error}</p>
								</div>
							{/if}

							<Button type="submit" size="lg" class="w-full h-12 text-base" disabled={loading || !email}>
								{loading ? 'Processing...' : 'Proceed to Payment'}
							</Button>

							<p class="text-xs text-center text-muted-foreground">
								Secure payment powered by Flutterwave
							</p>
						</form>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
</div>
