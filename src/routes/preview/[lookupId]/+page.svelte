<script lang="ts">
	import type { PageData } from './$types';
	import { formatCurrency } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<div class="bg-ink text-white">
		<div class="max-w-6xl mx-auto px-6 py-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-display text-white">Vehicle History Report</h1>
					<p class="text-white/60 mt-1 text-sm tracking-wide">Comprehensive Vehicle Information</p>
				</div>
				<div class="text-right">
					<div class="text-xs text-white/60 tracking-wide">Report Date</div>
					<div class="font-semibold text-white">{new Date().toLocaleDateString()}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Vehicle Title Bar -->
	<div class="bg-surface-warm border-b border-surface-border">
		<div class="max-w-6xl mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-display text-ink">{data.year} {data.make} {data.model}</h2>
					<p class="text-ink-muted font-mono text-sm mt-1 tracking-wide">VIN: {data.vin}</p>
				</div>
				<span class="badge-green">VERIFIED</span>
			</div>
		</div>
	</div>

	<div class="max-w-6xl mx-auto px-6 py-8 space-y-8">
		<!-- Vehicle Identification -->
		<section>
			<h3 class="text-xl font-semibold text-ink mb-4 pb-2 border-b-2 border-gold-400">Vehicle Identification</h3>
			<div class="card p-0 overflow-hidden">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide w-1/3">VIN</td>
							<td class="px-6 py-3 font-mono font-semibold text-ink">{data.vin}</td>
						</tr>
						<tr class="bg-surface-subtle border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide">Make</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.make}</td>
						</tr>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide">Model</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.model}</td>
						</tr>
						<tr class="bg-surface-subtle border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide">Year</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.year}</td>
						</tr>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide">Body Class</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.bodyClass}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Engine & Performance -->
		<section>
			<h3 class="text-xl font-semibold text-ink mb-4 pb-2 border-b-2 border-gold-400">Engine & Performance</h3>
			<div class="card p-0 overflow-hidden">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide w-1/3">Engine</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.engine}</td>
						</tr>
						<tr class="bg-surface-subtle border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide">Fuel Type</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.fuelType}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Manufacturing Information -->
		<section>
			<h3 class="text-xl font-semibold text-ink mb-4 pb-2 border-b-2 border-gold-400">Manufacturing Information</h3>
			<div class="card p-0 overflow-hidden">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-surface-border">
							<td class="px-6 py-3 text-ink-muted text-sm tracking-wide w-1/3">Plant Country</td>
							<td class="px-6 py-3 font-semibold text-ink">{data.plantCountry}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Import Duty Estimate -->
		<section>
			<h3 class="text-xl font-semibold text-ink mb-4 pb-2 border-b-2 border-gold-400">Import Duty Estimate</h3>
			<div class="card p-6">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-ink-muted text-sm tracking-wide mb-1">Estimated Total Duty</p>
						<p class="text-3xl font-bold text-gold-600">{formatCurrency(data.dutyEstimate)}</p>
					</div>
					<span class="badge-gold">{data.confidence} match</span>
				</div>
				<div class="bg-amber-50 border border-amber-200 rounded p-4 mt-4">
					<p class="text-sm font-semibold text-amber-900 mb-2">⚠️ Preview Mode - Limited Information</p>
					<p class="text-sm text-amber-800 tracking-wide">
						The full report includes complete duty breakdown, NCS valuation details, and official documentation.
					</p>
				</div>
			</div>
		</section>

		<!-- Unlock Full Report CTA -->
		<section class="card border-2 border-gold-400 p-8 text-center">
			<h3 class="text-2xl font-display text-ink mb-3">Unlock Complete Vehicle Report</h3>
			<p class="text-ink-muted tracking-wide mb-6">
				Get the full duty breakdown, detailed specifications, and official documentation
			</p>
			<div class="mb-6">
				<p class="text-4xl font-bold text-gold-600">₦5,000</p>
				<p class="text-sm text-ink-faint tracking-wide mt-1">One-time payment • Instant access</p>
			</div>
			<a href={`/checkout/${data.lookupId}`} class="btn-gold inline-flex items-center justify-center px-8 py-4 text-base">
				Get Full Report Now
			</a>
		</section>
	</div>

	<!-- Footer -->
	<footer class="bg-ink text-white mt-16">
		<div class="max-w-6xl mx-auto px-6 py-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h4 class="font-bold text-lg mb-2 text-white">About This Report</h4>
					<p class="text-white/60 text-sm tracking-wide">
						This vehicle history report is generated using data from NHTSA and NCS valuation tables.
						All duty calculations are estimates based on current CBN exchange rates.
					</p>
				</div>
				<div>
					<h4 class="font-bold text-lg mb-2 text-white">Disclaimer</h4>
					<p class="text-white/60 text-sm tracking-wide">
						This report is for informational purposes only. Actual import duties may vary.
						Please consult with Nigerian Customs Service for official duty assessment.
					</p>
				</div>
			</div>
			<div class="border-t border-white/10 mt-6 pt-6 text-center text-white/40 text-sm tracking-wide">
				<p>© {new Date().getFullYear()} MotoCheck. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
