<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { formatCurrency } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Clean Header -->
	<div class="bg-blue-600 text-white">
		<div class="max-w-6xl mx-auto px-6 py-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Vehicle History Report</h1>
					<p class="text-blue-100 mt-1">Comprehensive Vehicle Information</p>
				</div>
				<div class="text-right">
					<div class="text-sm text-blue-100">Report Date</div>
					<div class="font-semibold">{new Date().toLocaleDateString()}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Vehicle Title Bar -->
	<div class="bg-gray-200 border-b border-gray-300">
		<div class="max-w-6xl mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">{data.year} {data.make} {data.model}</h2>
					<p class="text-gray-600 font-mono text-sm mt-1">VIN: {data.vin}</p>
				</div>
				<Badge variant="outline" class="bg-green-50 text-green-700 border-green-300 px-4 py-2">
					VERIFIED
				</Badge>
			</div>
		</div>
	</div>

	<div class="max-w-6xl mx-auto px-6 py-8 space-y-8">
		<!-- Vehicle Identification -->
		<section>
			<h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">Vehicle Identification</h3>
			<div class="bg-white rounded border border-gray-200">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600 w-1/3">VIN</td>
							<td class="px-6 py-3 font-mono font-semibold">{data.vin}</td>
						</tr>
						<tr class="bg-gray-50 border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600">Make</td>
							<td class="px-6 py-3 font-semibold">{data.make}</td>
						</tr>
						<tr class="border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600">Model</td>
							<td class="px-6 py-3 font-semibold">{data.model}</td>
						</tr>
						<tr class="bg-gray-50 border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600">Year</td>
							<td class="px-6 py-3 font-semibold">{data.year}</td>
						</tr>
						<tr class="border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600">Body Class</td>
							<td class="px-6 py-3 font-semibold">{data.bodyClass}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Engine & Performance -->
		<section>
			<h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">Engine & Performance</h3>
			<div class="bg-white rounded border border-gray-200">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600 w-1/3">Engine</td>
							<td class="px-6 py-3 font-semibold">{data.engine}</td>
						</tr>
						<tr class="bg-gray-50 border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600">Fuel Type</td>
							<td class="px-6 py-3 font-semibold">{data.fuelType}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Manufacturing Information -->
		<section>
			<h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">Manufacturing Information</h3>
			<div class="bg-white rounded border border-gray-200">
				<table class="w-full">
					<tbody>
						<tr class="border-b border-gray-200">
							<td class="px-6 py-3 text-gray-600 w-1/3">Plant Country</td>
							<td class="px-6 py-3 font-semibold">{data.plantCountry}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<!-- Import Duty Estimate -->
		<section>
			<h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">Import Duty Estimate</h3>
			<div class="bg-white rounded border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-gray-600 text-sm mb-1">Estimated Total Duty</p>
						<p class="text-3xl font-bold text-blue-600">{formatCurrency(data.dutyEstimate)}</p>
					</div>
					<Badge variant="outline" class="text-sm">{data.confidence} match</Badge>
				</div>
				<div class="bg-amber-50 border border-amber-200 rounded p-4 mt-4">
					<p class="text-sm font-semibold text-amber-900 mb-2">⚠️ Preview Mode - Limited Information</p>
					<p class="text-sm text-amber-800">
						The full report includes complete duty breakdown, NCS valuation details, and official documentation.
					</p>
				</div>
			</div>
		</section>

		<!-- Unlock Full Report CTA -->
		<section class="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
			<h3 class="text-2xl font-bold text-gray-900 mb-3">Unlock Complete Vehicle Report</h3>
			<p class="text-gray-600 mb-6">
				Get the full duty breakdown, detailed specifications, and official documentation
			</p>
			<div class="mb-6">
				<p class="text-4xl font-bold text-blue-600">₦5,000</p>
				<p class="text-sm text-gray-500 mt-1">One-time payment • Instant access</p>
			</div>
			<Button size="lg" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg" href={`/checkout/${data.lookupId}`}>
				Get Full Report Now
			</Button>
		</section>
	</div>

	<!-- Clean Footer -->
	<footer class="bg-gray-800 text-white mt-16">
		<div class="max-w-6xl mx-auto px-6 py-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<h4 class="font-bold text-lg mb-2">About This Report</h4>
					<p class="text-gray-300 text-sm">
						This vehicle history report is generated using data from NHTSA and NCS valuation tables.
						All duty calculations are estimates based on current CBN exchange rates.
					</p>
				</div>
				<div>
					<h4 class="font-bold text-lg mb-2">Disclaimer</h4>
					<p class="text-gray-300 text-sm">
						This report is for informational purposes only. Actual import duties may vary.
						Please consult with Nigerian Customs Service for official duty assessment.
					</p>
				</div>
			</div>
			<div class="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-sm">
				<p>© {new Date().getFullYear()} MotoCheck. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>
