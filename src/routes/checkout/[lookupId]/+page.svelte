<script lang="ts">
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
	<div class="fixed inset-0 bg-white z-50 flex items-center justify-center">
		<div class="text-center space-y-6 max-w-md px-4">
			<div class="relative w-24 h-24 mx-auto">
				<div class="absolute inset-0 border-4 border-gold-200 rounded-full"></div>
				<div class="absolute inset-0 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
			<div class="space-y-2">
				<h2 class="text-2xl font-bold text-ink">Redirecting to payment...</h2>
				<p class="text-ink-muted tracking-wide">Please wait</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-white">
	<div class="bg-surface-warm border-b border-surface-border">
		<div class="max-w-4xl mx-auto px-4 py-6">
			<a href={`/preview/${data.lookupId}`} class="btn-ghost inline-flex items-center mb-4">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
				</svg>
				Back to Preview
			</a>
			<h1 class="text-2xl md:text-3xl font-display text-ink">Complete Your Purchase</h1>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 py-8">
		<div class="grid lg:grid-cols-5 gap-8">
			<!-- Order Summary -->
			<div class="lg:col-span-3 space-y-6">
				<div class="card p-6 space-y-4">
					<h2 class="text-lg font-semibold text-ink">Vehicle Details</h2>
					<div class="space-y-3">
						<div>
							<h3 class="text-2xl font-display text-ink">{data.year} {data.make} {data.model}</h3>
							<p class="text-sm text-ink-muted font-mono mt-1 tracking-wide">VIN: {data.vin}</p>
						</div>
						<div class="divider-dashed"></div>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-ink-muted tracking-wide">Engine</p>
								<p class="font-medium text-ink">{data.engine}</p>
							</div>
							<div>
								<p class="text-ink-muted tracking-wide">Body Class</p>
								<p class="font-medium text-ink">{data.bodyClass}</p>
							</div>
							<div>
								<p class="text-ink-muted tracking-wide">Fuel Type</p>
								<p class="font-medium text-ink">{data.fuelType}</p>
							</div>
							<div>
								<p class="text-ink-muted tracking-wide">Origin</p>
								<p class="font-medium text-ink">{data.plantCountry}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="card p-6 space-y-4">
					<h2 class="text-lg font-semibold text-ink">What You'll Get</h2>
					<ul class="space-y-3">
						<li class="flex gap-3">
							<svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<div>
								<p class="font-medium text-ink">Complete Duty Breakdown</p>
								<p class="text-sm text-ink-muted tracking-wide">All 7 components itemized with calculations</p>
							</div>
						</li>
						<li class="flex gap-3">
							<svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<div>
								<p class="font-medium text-ink">Official NCS Valuation</p>
								<p class="text-sm text-ink-muted tracking-wide">Vehicle value used for duty calculation</p>
							</div>
						</li>
						<li class="flex gap-3">
							<svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<div>
								<p class="font-medium text-ink">Downloadable PDF Report</p>
								<p class="text-sm text-ink-muted tracking-wide">Sent to your email instantly</p>
							</div>
						</li>
					</ul>
				</div>
			</div>

			<!-- Payment Form -->
			<div class="lg:col-span-2">
				<div class="lg:sticky lg:top-6 space-y-6">
					<div class="card p-6 space-y-4">
						<h2 class="text-lg font-semibold text-ink">Order Summary</h2>
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-ink-muted tracking-wide">Report Fee</span>
								<span class="font-medium text-ink">{formatCurrency(REPORT_PRICE_NGN)}</span>
							</div>
							<div class="divider-dashed"></div>
							<div class="flex justify-between">
								<span class="font-semibold text-ink">Total</span>
								<span class="text-2xl font-bold text-gold-600">{formatCurrency(REPORT_PRICE_NGN)}</span>
							</div>
						</div>
					</div>

					<form onsubmit={(e) => { e.preventDefault(); handleCheckout(); }} class="card p-6 space-y-4">
						<div class="space-y-2">
							<label for="email" class="label-base">Email Address</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="your@email.com"
								disabled={loading}
								class="input-lg"
								required
							/>
							<p class="text-sm text-ink-faint tracking-wide">Report will be sent to this email</p>
						</div>

						{#if error}
							<div class="p-3 bg-red-50 border border-red-200 rounded">
								<p class="text-sm text-red-600">{error}</p>
							</div>
						{/if}

						<button type="submit" class="btn-gold w-full justify-center py-4 text-base" disabled={loading || !email}>
							{loading ? 'Processing...' : 'Proceed to Payment'}
						</button>

						<p class="text-xs text-center text-ink-faint tracking-wide">
							Secure payment powered by Paystack
						</p>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
