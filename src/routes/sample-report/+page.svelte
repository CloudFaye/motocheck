<script lang="ts">
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
	<meta name="description" content="View a sample vehicle history and import duty report for a 2021 Honda Accord. See what information you'll receive with your VIN check." />
</svelte:head>

<!-- Page Header -->
<div class="bg-surface-warm border-b border-surface-border">
	<div class="container-wide section-pad">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="heading-section mb-2">Sample Vehicle Report</h1>
				<p class="body-base text-ink-muted">
					See exactly what information you'll receive with your VIN check
				</p>
			</div>
			<a href="/#vin-form" class="btn-gold">
				Check Your VIN
			</a>
		</div>
	</div>
</div>

<!-- Main Content -->
<div class="container-wide section-pad">
	<div class="grid lg:grid-cols-3 gap-8">
		
		<!-- Main Content (2/3) -->
		<div class="lg:col-span-2 space-y-6">
			
			<!-- Vehicle Identity -->
			<div class="card">
				<div class="flex items-start justify-between mb-6">
					<div>
						<h2 class="text-2xl font-display font-semibold text-ink mb-2">
							{report.year} {report.make} {report.model}
						</h2>
						<p class="text-ink-muted">{report.trim}</p>
					</div>
					<div class="flex flex-row items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						NHTSA Verified
					</div>
				</div>
				
				<div class="bg-surface-subtle rounded-xl p-4 mb-6">
					<div class="flex items-center gap-3">
						<div class="report-icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
							</svg>
						</div>
						<div>
							<div class="text-xs text-ink-muted mb-1">Vehicle Identification Number</div>
							<div class="font-mono text-lg font-semibold tracking-widest text-ink">{report.vin}</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="text-xs text-ink-muted mb-1">Body Style</div>
						<div class="font-medium text-ink">{report.bodyStyle}</div>
					</div>
					<div>
						<div class="text-xs text-ink-muted mb-1">Exterior Color</div>
						<div class="font-medium text-ink">{report.color}</div>
					</div>
					<div>
						<div class="text-xs text-ink-muted mb-1">Fuel Type</div>
						<div class="font-medium text-ink">{report.fuelType}</div>
					</div>
					<div>
						<div class="text-xs text-ink-muted mb-1">Doors</div>
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
				<div class="flex items-center gap-3 p-6 bg-green-50 rounded-xl border border-green-200">
					<div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div>
						<div class="font-semibold text-green-900 mb-1">No Active Recalls</div>
						<div class="text-sm text-green-700">
							This vehicle has no open safety recalls according to NHTSA records.
						</div>
					</div>
				</div>
			</div>

		</div>

		<!-- Sidebar (1/3) -->
		<div class="lg:sticky lg:top-24 lg:self-start space-y-6">
			
			<!-- Import Duty Summary -->
			<div class="card">
				<div class="flex items-center gap-2 mb-6 pb-4 border-b border-gold-200 bg-gold-50 -m-6 mb-6 p-6 rounded-t-2xl">
					<svg class="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<h3 class="font-display font-semibold text-lg text-gold-900">Import Duty Estimate</h3>
				</div>

				<div class="space-y-4">
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">CIF Value (USD)</span>
						<span class="font-mono font-medium text-ink">{fmtUSD(report.cifUSD)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">Exchange Rate</span>
						<span class="font-mono font-medium text-ink">₦{report.exchangeRate}/USD</span>
					</div>
					<div class="flex justify-between items-baseline pt-3 border-t border-surface-border">
						<span class="text-sm text-ink-muted">CIF Value (NGN)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.cifNGN)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">Import Duty ({report.importDutyRate}%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.importDutyNGN)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">ECOWAS Levy (5%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.levyNGN)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">VAT (7.5%)</span>
						<span class="font-mono font-medium text-ink">{fmt(report.vatNGN)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-ink-muted">Port Charges</span>
						<span class="font-mono font-medium text-ink">{fmt(report.portChargesNGN)}</span>
					</div>
					<div class="flex justify-between items-baseline pt-4 border-t-2 border-gold-200">
						<span class="font-semibold text-ink">Total Estimate</span>
						<span class="font-mono font-bold text-2xl text-gold-600">{fmt(report.totalNGN)}</span>
					</div>
				</div>

				<div class="mt-6 p-4 bg-surface-subtle rounded-xl">
					<p class="text-xs text-ink-muted leading-relaxed">
						This is an estimate based on current NCS valuation tables and exchange rates. 
						Actual costs may vary depending on port of entry and vehicle condition.
					</p>
				</div>
			</div>

			<!-- NCS Valuation -->
			<div class="card-sm">
				<h4 class="font-semibold text-ink mb-3">NCS Valuation</h4>
				<div class="flex items-baseline gap-2 mb-2">
					<span class="text-3xl font-bold font-mono text-ink">{fmtUSD(report.ncsValuation)}</span>
				</div>
				<p class="text-xs text-ink-muted">
					Official Nigerian Customs Service reference value for duty calculation
				</p>
			</div>

			<!-- Report Metadata -->
			<div class="card-sm">
				<h4 class="font-semibold text-ink mb-4">Report Information</h4>
				<div class="space-y-3 text-sm">
					<div>
						<div class="text-xs text-ink-muted mb-1">Generated</div>
						<div class="text-ink">{report.reportDate}</div>
					</div>
					<div>
						<div class="text-xs text-ink-muted mb-1">Data Sources</div>
						<div class="text-ink">NHTSA, NCS, OEM Records</div>
					</div>
					<div>
						<div class="text-xs text-ink-muted mb-1">Exchange Rate Date</div>
						<div class="text-ink">{report.reportDate}</div>
					</div>
				</div>
			</div>

			<!-- CTA Button -->
			<a href="/#vin-form" class="btn-gold w-full text-center block">
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
