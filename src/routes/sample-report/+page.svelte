<script lang="ts">
	import { resolve } from '$app/paths';

	// Sample report data for 2021 Honda Accord
	const report = {
		vin: '1HGCV1F16MA000001',
		year: 2021,
		make: 'Honda',
		model: 'Accord',
		trim: 'Sport 1.5T',
		engine: '1.5L L4 DOHC 16V TURBO',
		transmission: 'CVT',
		drivetrain: 'FWD',
		bodyStyle: '4-Door Sedan',
		color: 'Platinum White Pearl',
		fuelType: 'Gasoline',
		doors: 4,
		plant: 'Marysville Assembly Plant',
		mfgDate: 'March 2021',
		country: 'United States',
		destMarket: 'North America',
		gvwr: '4,542 lbs',
		recalls: [],

		// Duty calculations (in NGN)
		cifUSD: 13500,
		exchangeRate: 1650,
		cifNGN: 22275000,
		importDutyRate: 35,
		importDutyNGN: 7796250,
		levyNGN: 1113750,
		vatNGN: 2318625,
		portChargesNGN: 450000,
		totalNGN: 33953625,

		// Metadata
		ncsValuation: 13500,
		reportDate: new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	};

	function fmt(n: number): string {
		return '₦' + n.toLocaleString('en-NG');
	}

	function fmtUSD(n: number): string {
		return '$' + n.toLocaleString('en-US');
	}
</script>

<svelte:head>
	<title>Sample Vehicle Report - 2021 Honda Accord | MotoCheck</title>
	<meta
		name="description"
		content="View a sample vehicle history and import duty report for a 2021 Honda Accord. See what information you'll receive with your VIN check."
	/>
</svelte:head>

<!-- Page Header -->
<div class="border-b border-surface-border bg-surface-warm">
	<div class="container-wide section-pad">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="heading-section mb-2">Sample Vehicle Report</h1>
				<p class="body-base text-ink-muted">
					See exactly what information you'll receive with your VIN check
				</p>
			</div>
			<a href={resolve('/#vin-form')} class="btn-gold"> Check Your VIN </a>
		</div>
	</div>
</div>

<!-- Main Content -->
<div class="container-wide section-pad">
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Main Content (2/3) -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Vehicle Identity -->
			<div class="card">
				<div class="mb-6 flex items-start justify-between">
					<div>
						<h2 class="mb-2 font-display text-2xl font-semibold text-ink">
							{report.year}
							{report.make}
							{report.model}
						</h2>
						<p class="text-ink-muted">{report.trim}</p>
					</div>
					<div class="flex flex-row items-center gap-2">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						NHTSA Verified
					</div>
				</div>

				<div class="mb-6 rounded-xl bg-surface-subtle p-4">
					<div class="flex items-center gap-3">
						<div class="report-icon">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
								/>
							</svg>
						</div>
						<div>
							<div class="mb-1 text-xs text-ink-muted">Vehicle Identification Number</div>
							<div class="font-mono text-lg font-semibold tracking-widest text-ink">
								{report.vin}
							</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="mb-1 text-xs text-ink-muted">Body Style</div>
						<div class="font-medium text-ink">{report.bodyStyle}</div>
					</div>
					<div>
						<div class="mb-1 text-xs text-ink-muted">Exterior Color</div>
						<div class="font-medium text-ink">{report.color}</div>
					</div>
					<div>
						<div class="mb-1 text-xs text-ink-muted">Fuel Type</div>
						<div class="font-medium text-ink">{report.fuelType}</div>
					</div>
					<div>
						<div class="mb-1 text-xs text-ink-muted">Doors</div>
						<div class="font-medium text-ink">{report.doors}</div>
					</div>
				</div>
			</div>

			<!-- Specifications Table -->
			<div class="card">
				<h3 class="report-section-head">Vehicle Specifications</h3>
				<div class="data-table">
					<table>
						<tbody>
							<tr>
								<td>Engine</td>
								<td>{report.engine}</td>
							</tr>
							<tr>
								<td>Transmission</td>
								<td>{report.transmission}</td>
							</tr>
							<tr>
								<td>Drivetrain</td>
								<td>{report.drivetrain}</td>
							</tr>
							<tr>
								<td>GVWR</td>
								<td>{report.gvwr}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Manufacturing Details -->
			<div class="card">
				<h3 class="report-section-head">Manufacturing Details</h3>
				<div class="data-table">
					<table>
						<tbody>
							<tr>
								<td>Manufacturing Plant</td>
								<td>{report.plant}</td>
							</tr>
							<tr>
								<td>Manufacturing Date</td>
								<td>{report.mfgDate}</td>
							</tr>
							<tr>
								<td>Country of Origin</td>
								<td>{report.country}</td>
							</tr>
							<tr>
								<td>Destination Market</td>
								<td>{report.destMarket}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Safety Recalls -->
			<div class="card">
				<h3 class="report-section-head">Safety Recalls</h3>
				<div class="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6">
					<div
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-6 w-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<div class="mb-1 font-semibold text-green-900">No Active Recalls</div>
						<div class="text-sm text-green-700">
							This vehicle has no open safety recalls according to NHTSA records.
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Sidebar (1/3) -->
		<div class="space-y-6 lg:sticky lg:top-24 lg:self-start">
			<!-- Import Duty Summary -->
			<div class="card">
				<div
					class="-m-6 mb-6 flex items-center gap-2 rounded-t-2xl border-b border-gold-200 bg-gold-50 p-6 pb-4"
				>
					<svg class="h-5 w-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h3 class="font-display text-lg font-semibold text-gold-900">Import Duty Estimate</h3>
				</div>

				<div class="space-y-4">
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">CIF Value (USD)</span>
						<span class="font-mono font-medium text-ink">{fmtUSD(report.cifUSD)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">Exchange Rate</span>
						<span class="font-mono font-medium text-ink">₦{report.exchangeRate}/USD</span>
					</div>
					<div class="flex items-baseline justify-between border-t border-surface-border pt-3">
						<span class="text-sm text-ink-muted">CIF Value (NGN)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.cifNGN)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">Import Duty ({report.importDutyRate}%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.importDutyNGN)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">ECOWAS Levy (5%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.levyNGN)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">VAT (7.5%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.vatNGN)}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-sm text-ink-muted">Port Charges</span>
						<span class="font-mono font-medium text-ink">{fmt(report.portChargesNGN)}</span>
					</div>
					<div class="flex items-baseline justify-between border-t-2 border-gold-200 pt-4">
						<span class="font-semibold text-ink">Total Estimate</span>
						<span class="font-mono text-2xl font-bold text-gold-600">{fmt(report.totalNGN)}</span>
					</div>
				</div>

				<div class="mt-6 rounded-xl bg-surface-subtle p-4">
					<p class="text-xs leading-relaxed text-ink-muted">
						This is an estimate based on current NCS valuation tables and exchange rates. Actual
						costs may vary depending on port of entry and vehicle condition.
					</p>
				</div>
			</div>

			<!-- NCS Valuation -->
			<div class="card-sm">
				<h4 class="mb-3 font-semibold text-ink">NCS Valuation</h4>
				<div class="mb-2 flex items-baseline gap-2">
					<span class="font-mono text-3xl font-bold text-ink">{fmtUSD(report.ncsValuation)}</span>
				</div>
				<p class="text-xs text-ink-muted">
					Official Nigerian Customs Service reference value for duty calculation
				</p>
			</div>

			<!-- Report Metadata -->
			<div class="card-sm">
				<h4 class="mb-4 font-semibold text-ink">Report Information</h4>
				<div class="space-y-3 text-sm">
					<div>
						<div class="mb-1 text-xs text-ink-muted">Generated</div>
						<div class="text-ink">{report.reportDate}</div>
					</div>
					<div>
						<div class="mb-1 text-xs text-ink-muted">Data Sources</div>
						<div class="text-ink">NHTSA, NCS, OEM Records</div>
					</div>
					<div>
						<div class="mb-1 text-xs text-ink-muted">Exchange Rate Date</div>
						<div class="text-ink">{report.reportDate}</div>
					</div>
				</div>
			</div>

			<!-- CTA Button -->
			<a href={resolve('/#vin-form')} class="btn-gold block w-full text-center">
				Check Your Own VIN
			</a>
		</div>
	</div>
</div>

<style>
	/* Ensure tabular numbers for aligned currency display */
	.font-mono {
		font-variant-numeric: tabular-nums;
	}
</style>
