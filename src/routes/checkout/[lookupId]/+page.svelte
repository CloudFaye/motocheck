<script lang="ts">
	import { resolve } from '$app/paths';
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white">
		<div class="max-w-md space-y-6 px-4 text-center">
			<div class="relative mx-auto h-24 w-24">
				<div class="absolute inset-0 rounded-full border-4 border-gold-200"></div>
				<div
					class="absolute inset-0 animate-spin rounded-full border-4 border-gold-500 border-t-transparent"
				></div>
			</div>
			<div class="space-y-2">
				<h2 class="text-2xl font-bold text-ink">Redirecting to payment...</h2>
				<p class="tracking-wide text-ink-muted">Please wait</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-white">
	<div class="border-b border-surface-border bg-surface-warm">
		<div class="mx-auto max-w-4xl px-4 py-6">
			<a
				href={resolve('/preview/[lookupId]', { lookupId: data.lookupId })}
				class="btn-ghost mb-4 inline-flex items-center"
			>
				<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to Preview
			</a>
			<h1 class="font-display text-2xl text-ink md:text-3xl">Complete Your Purchase</h1>
		</div>
	</div>

	<div class="mx-auto max-w-4xl px-4 py-8">
		<div class="grid gap-8 lg:grid-cols-5">
			<!-- Order Summary -->
			<div class="space-y-6 lg:col-span-3">
				<div class="card space-y-4 p-6">
					<h2 class="text-lg font-semibold text-ink">Vehicle Details</h2>
					<div class="space-y-3">
						<div>
							<h3 class="font-display text-2xl text-ink">{data.year} {data.make} {data.model}</h3>
							<p class="mt-1 font-mono text-sm tracking-wide text-ink-muted">VIN: {data.vin}</p>
						</div>
						<div class="divider-dashed"></div>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="tracking-wide text-ink-muted">Engine</p>
								<p class="font-medium text-ink">{data.engine}</p>
							</div>
							<div>
								<p class="tracking-wide text-ink-muted">Body Class</p>
								<p class="font-medium text-ink">{data.bodyClass}</p>
							</div>
							<div>
								<p class="tracking-wide text-ink-muted">Fuel Type</p>
								<p class="font-medium text-ink">{data.fuelType}</p>
							</div>
							<div>
								<p class="tracking-wide text-ink-muted">Origin</p>
								<p class="font-medium text-ink">{data.plantCountry}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="card space-y-4 p-6">
					<h2 class="text-lg font-semibold text-ink">What You'll Get</h2>
					<ul class="space-y-3">
						<li class="flex gap-3">
							<svg
								class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<p class="font-medium text-ink">Complete Duty Breakdown</p>
								<p class="text-sm tracking-wide text-ink-muted">
									All 7 components itemized with calculations
								</p>
							</div>
						</li>
						<li class="flex gap-3">
							<svg
								class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<p class="font-medium text-ink">Official NCS Valuation</p>
								<p class="text-sm tracking-wide text-ink-muted">
									Vehicle value used for duty calculation
								</p>
							</div>
						</li>
						<li class="flex gap-3">
							<svg
								class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<p class="font-medium text-ink">Downloadable PDF Report</p>
								<p class="text-sm tracking-wide text-ink-muted">Sent to your email instantly</p>
							</div>
						</li>
					</ul>
				</div>
			</div>

			<!-- Payment Form -->
			<div class="lg:col-span-2">
				<div class="space-y-6 lg:sticky lg:top-6">
					<div class="card space-y-4 p-6">
						<h2 class="text-lg font-semibold text-ink">Order Summary</h2>
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="tracking-wide text-ink-muted">Report Fee</span>
								<span class="font-medium text-ink">{formatCurrency(REPORT_PRICE_NGN)}</span>
							</div>
							<div class="divider-dashed"></div>
							<div class="flex justify-between">
								<span class="font-semibold text-ink">Total</span>
								<span class="text-2xl font-bold text-gold-600"
									>{formatCurrency(REPORT_PRICE_NGN)}</span
								>
							</div>
						</div>
					</div>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleCheckout();
						}}
						class="card space-y-4 p-6"
					>
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
							<p class="text-sm tracking-wide text-ink-faint">Report will be sent to this email</p>
						</div>

						{#if error}
							<div class="rounded border border-red-200 bg-red-50 p-3">
								<p class="text-sm text-red-600">{error}</p>
							</div>
						{/if}

						<button
							type="submit"
							class="btn-gold w-full justify-center py-4 text-base"
							disabled={loading || !email}
						>
							{loading ? 'Processing...' : 'Proceed to Payment'}
						</button>

						<p class="text-center text-xs tracking-wide text-ink-faint">
							Secure payment powered by Paystack
						</p>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
