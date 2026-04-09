<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { formatCurrency } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<div class="bg-ink text-white">
		<div class="mx-auto max-w-6xl px-6 py-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="font-display text-3xl text-white">Vehicle History Report</h1>
					<p class="mt-1 text-sm tracking-wide text-white/60">Comprehensive Vehicle Information</p>
				</div>
				<div class="text-right">
					<div class="text-xs tracking-wide text-white/60">Report Date</div>
					<div class="font-semibold text-white">{new Date().toLocaleDateString()}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Vehicle Title Bar -->
	<div class="border-b border-surface-border bg-surface-warm">
		<div class="mx-auto max-w-6xl px-6 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-display text-2xl text-ink">{data.year} {data.make} {data.model}</h2>
					<p class="mt-1 font-mono text-sm tracking-wide text-ink-muted">VIN: {data.vin}</p>
				</div>
				<span class="badge-green">VERIFIED</span>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-6xl space-y-8 px-6 py-8">
		<!-- Vehicle Identification -->
		<section>
			<h3 class="mb-4 border-b-2 border-gold-400 pb-2 text-xl font-semibold text-ink">
				Vehicle Identification
			</h3>
			<div class="card overflow-hidden p-0">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="w-1/3 px-6 py-3 text-sm tracking-wide text-ink-muted">VIN</td>
							<td class="px-6 py-3 font-mono font-semibold text-ink">{data.vin}</td>
						</tr>
						<tr class="border-b border-surface-border bg-surface-subtle">
							<td class="px-6 py-3 text-sm tracking-wide text-ink-muted">Make</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.make}</td>
						</tr>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-sm tracking-wide text-ink-muted">Model</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.model}</td>
						</tr>
						<tr class="border-b border-surface-border bg-surface-subtle">
							<td class="px-6 py-3 text-sm tracking-wide text-ink-muted">Year</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.year}</td>
						</tr>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-sm tracking-wide text-ink-muted">Body Class</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.bodyClass}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Engine & Performance -->
		<section>
			<h3 class="mb-4 border-b-2 border-gold-400 pb-2 text-xl font-semibold text-ink">
				Engine & Performance
			</h3>
			<div class="card overflow-hidden p-0">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="w-1/3 px-6 py-3 text-sm tracking-wide text-ink-muted">Engine</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.engine}</td>
						</tr>
						<tr class="border-b border-surface-border bg-surface-subtle">
							<td class="px-6 py-3 text-sm tracking-wide text-ink-muted">Fuel Type</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.fuelType}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Manufacturing Information -->
		<section>
			<h3 class="mb-4 border-b-2 border-gold-400 pb-2 text-xl font-semibold text-ink">
				Manufacturing Information
			</h3>
			<div class="card overflow-hidden p-0">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="w-1/3 px-6 py-3 text-sm tracking-wide text-ink-muted">Plant Country</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.plantCountry}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Import Duty Estimate -->
		<section>
			<h3 class="mb-4 border-b-2 border-gold-400 pb-2 text-xl font-semibold text-ink">
				Import Duty Estimate
			</h3>
			<div class="card p-6">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<p class="mb-1 text-sm tracking-wide text-ink-muted">Estimated Total Duty</p>
						<p class="text-3xl font-bold text-gold-600">{formatCurrency(data.dutyEstimate)}</p>
					</div>
					<span class="badge-gold">{data.confidence} match</span>
				</div>
				<div class="mt-4 rounded border border-amber-200 bg-amber-50 p-4">
					<p class="mb-2 text-sm font-semibold text-amber-900">
						⚠️ Preview Mode - Limited Information
					</p>
					<p class="text-sm tracking-wide text-amber-800">
						The full report includes complete duty breakdown, NCS valuation details, and official
						documentation.
					</p>
				</div>
			</div>
		</section>

		<!-- Unlock Full Report CTA -->
		<section class="card border-2 border-gold-400 p-8 text-center">
			<h3 class="mb-3 font-display text-2xl text-ink">Unlock Complete Vehicle Report</h3>
			<p class="mb-6 tracking-wide text-ink-muted">
				Get the full duty breakdown, detailed specifications, and official documentation
			</p>
			<div class="mb-6">
				<p class="text-4xl font-bold text-gold-600">₦5,000</p>
				<p class="mt-1 text-sm tracking-wide text-ink-faint">One-time payment • Instant access</p>
			</div>
			<a
				href={resolve('/checkout/[lookupId]', { lookupId: data.lookupId })}
				class="btn-gold inline-flex items-center justify-center px-8 py-4 text-base"
			>
				Get Full Report Now
			</a>
		</section>
	</div>

	<!-- Footer -->
	<footer class="mt-16 bg-ink text-white">
		<div class="mx-auto max-w-6xl px-6 py-8">
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
				<div>
					<h4 class="mb-2 text-lg font-bold text-white">About This Report</h4>
					<p class="text-sm tracking-wide text-white/60">
						This vehicle history report is generated using data from NHTSA and NCS valuation tables.
						All duty calculations are estimates based on current CBN exchange rates.
					</p>
				</div>
				<div>
					<h4 class="mb-2 text-lg font-bold text-white">Disclaimer</h4>
					<p class="text-sm tracking-wide text-white/60">
						This report is for informational purposes only. Actual import duties may vary. Please
						consult with Nigerian Customs Service for official duty assessment.
					</p>
				</div>
			</div>
			<div
				class="mt-6 border-t border-white/10 pt-6 text-center text-sm tracking-wide text-white/40"
			>
				<p>© {new Date().getFullYear()} MotoCheck. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
