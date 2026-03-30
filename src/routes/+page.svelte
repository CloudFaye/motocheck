<script lang="ts">
	import { goto } from '$app/navigation';
	import { sanitizeVIN, getVINError } from '$lib/vin-validator';
	import { toast } from 'svelte-sonner';

	let vin = $state('');
	let loading = $state(false);
	let openFaq = $state<number | null>(null);

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		vin = sanitizeVIN(input.value);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
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
				toast.error(data.error || 'VIN not found');
				loading = false;
				return;
			}

			const data = await res.json();
			await goto(`/preview/${data.lookupId}`);
		} catch {
			toast.error('Network Error');
			loading = false;
		}
	}

	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
	}

	const faqs = [
		{
			q: 'What do I need to get started?',
			a: "Just your vehicle's 17-character VIN (Vehicle Identification Number). You'll find it on the dashboard near the windscreen, inside the driver's door jamb, on your registration document, or in your insurance papers."
		},
		{
			q: 'How accurate are the duty calculations?',
			a: 'Our calculations use official NCS valuation tables and live CBN exchange rates fetched at the time of your report. Final duties may vary slightly based on customs officer assessment, but our estimates are consistently within ±3%.'
		},
		{
			q: 'How quickly will I receive my report?',
			a: 'Instantly — the moment payment is confirmed, your detailed PDF report is generated and emailed to you. It typically lands in your inbox within 60 seconds.'
		},
		{
			q: 'Which payment methods are accepted?',
			a: 'We accept all major cards, bank transfers, and USSD via Paystack. All transactions are encrypted end-to-end.'
		},
		{
			q: 'Can I check a car that is already in Nigeria?',
			a: 'Yes. Our reports are useful for pre-purchase checks on locally listed vehicles too — you can verify mileage accuracy, check for undisclosed accidents, confirm specs, and review recall history.'
		},
		{
			q: 'What is your refund policy?',
			a: 'Because reports are generated and delivered instantly, all sales are final. If you experience a technical issue or receive an incomplete report, contact us within 48 hours and we will resolve it promptly.'
		}
	];

	const inspects = [
		{
			icon: `<path d="M5 2h6l2 3H3L5 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 7.5v3M6.5 9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
			title: 'Vehicle Specifications',
			desc: 'Engine, transmission, trim level, wheelbase, fuel type, GVWR, and all factory options.'
		},
		{
			icon: `<path d="M3 5h10M3 8h8M3 11h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M13 9l1.5 1.5L13 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
			title: 'Import Duty Breakdown',
			desc: 'Line-by-line NCS duty, levy, ECOWAS CET, VAT, and port charges — all calculated at current CBN rates.'
		},
		{
			icon: `<path d="M8 2L9.5 6H14L10.5 8.5 12 13 8 10.5 4 13l1.5-4.5L2 6h4.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`,
			title: 'Safety Recalls',
			desc: 'All active NHTSA campaigns and OEM recall notices affecting your specific VIN.'
		},
		{
			icon: `<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M5 8h6M5 5h4M5 11h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
			title: 'Manufacturing Details',
			desc: 'Assembly plant, production date, country of origin, and restraint system configuration.'
		},
		{
			icon: `<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 8.5L7 10l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
			title: 'Market Compliance',
			desc: 'Destination market, emissions standard, and Nigerian SON/NAFDAC import compliance notes.'
		},
		{
			icon: `<path d="M3 4h10v7.5L8 14 3 11.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 8.5L7 10l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
			title: 'NCS Valuation',
			desc: 'Official Nigerian Customs Service reference value used as the basis for your duty assessment.'
		}
	];
</script>


{#if loading}
	<div class="fixed inset-0 bg-white z-50 flex items-center justify-center">
		<div class="text-center space-y-6 max-w-md px-4">
			<div class="relative w-24 h-24 mx-auto">
				<div class="absolute inset-0 border-4 border-gold-200 rounded-full"></div>
				<div class="absolute inset-0 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
			<div class="space-y-2">
				<h2 class="text-2xl font-bold text-gray-900">Analyzing VIN...</h2>
				<p class="text-gray-600">Fetching vehicle data</p>
			</div>
		</div>
	</div>
{/if}

<!-- ════════════════════════════════════════════════════
     HERO
════════════════════════════════════════════════════════ -->
<section class="relative bg-white overflow-hidden">

	<!-- Subtle background texture -->
	<div class="absolute inset-0 pointer-events-none">
		<!-- Faint grid -->
		<svg class="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
					<path d="M 48 0 L 0 0 0 48" fill="none" stroke="#000" stroke-width="0.5" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
		<!-- Gold gradient wash, bottom-right -->
		<div
			class="absolute bottom-0 right-0 w-[600px] h-[500px] bg-gradient-to-tl from-gold-100/50 via-transparent to-transparent rounded-full blur-3xl"
		></div>
	</div>

	<div class="container-wide relative z-10 pt-20 pb-24 md:pt-28 md:pb-32">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

			<!-- Left: copy + form -->
			<div class="animate-fade-up">
				<!-- Eyebrow badge -->
				<div
					class="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-full"
				>
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft"></span>
					<span class="text-xs font-medium font-sans text-ink-muted"
						>Trusted by 10,000+ importers across Nigeria</span
					>
				</div>

				<h1 class="heading-display mb-6">
					Know exactly what<br />
					<em class="not-italic text-gold-500">you'll pay</em> before<br />
					your car arrives.
				</h1>

				<p class="body-lg max-w-md mb-10">
					Enter a VIN. Get a comprehensive vehicle history, accurate NCS import duty calculation,
					and safety recall data — delivered instantly to your inbox.
				</p>

				<!-- VIN Form -->
				<form id="vin-form" onsubmit={handleSubmit} class="w-full max-w-md">
					<label class="label-base" for="vin-input"
						>Vehicle Identification Number (VIN)</label
					>
					<div class="relative">
						<input
							id="vin-input"
							type="text"
							class="input-lg pr-36 font-mono"
							placeholder="1HGBH41JXMN109186"
							value={vin}
							oninput={handleInput}
							maxlength="17"
							autocomplete="off"
							spellcheck="false"
							disabled={loading}
						/>
						<!-- Character counter -->
						<span
							class="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-medium tabular-nums"
							class:text-gold-500={vin.length === 17}
							class:text-ink-faint={vin.length < 17}
						>
							{vin.length}<span class="opacity-40">/17</span>
						</span>
					</div>

					<p class="mt-2 text-xs text-ink-faint font-sans">
						Found on your dashboard, door jamb, or registration document.
					</p>

					<button
						type="submit"
						class="btn-gold w-full mt-4 justify-center py-4 text-base"
						disabled={loading || vin.length !== 17}
					>
						{#if loading}
							<svg class="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
								<circle
									cx="8"
									cy="8"
									r="6"
									stroke="currentColor"
									stroke-width="2"
									stroke-dasharray="16"
									stroke-dashoffset="8"
									stroke-linecap="round"
								/>
							</svg>
							Generating report…
						{:else}
							Get Instant Report
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path
									d="M3 8h10M9 4.5L12.5 8 9 11.5"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</button>

					<!-- Trust row -->
					<div class="flex items-center gap-5 mt-4">
						{#each ['Instant delivery', 'Paystack secured', '₦2,500 flat fee'] as trust}
							<span class="flex items-center gap-1.5 text-xs text-ink-muted font-sans">
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
									<circle cx="6" cy="6" r="5" stroke="#10b981" stroke-width="1.2" />
									<path
										d="M3.5 6L5 7.5 8.5 4"
										stroke="#10b981"
										stroke-width="1.2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								{trust}
							</span>
						{/each}
					</div>
				</form>
			</div>

			<!-- Right: visual card -->
			<div class="hidden lg:flex items-center justify-center animate-fade-up animate-delay-200">
				<div class="relative w-full max-w-sm">
					<!-- Sample report preview card -->
					<div class="card p-0 overflow-hidden">
						<!-- Card header -->
						<div
							class="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-warm"
						>
							<div class="flex items-center gap-2.5">
								<div class="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
									<svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="text-white">
										<path
											d="M3 9.5L4.5 5.5h7L13 9.5"
											stroke="currentColor"
											stroke-width="1.3"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<rect
											x="2"
											y="9.5"
											width="12"
											height="3.5"
											rx="1"
											stroke="currentColor"
											stroke-width="1.3"
										/>
										<circle cx="5" cy="13.5" r="1" fill="currentColor" />
										<circle cx="11" cy="13.5" r="1" fill="currentColor" />
									</svg>
								</div>
								<div>
									<p class="text-xs font-semibold font-sans text-ink">Vehicle Report</p>
									<p class="text-2xs text-ink-faint font-sans font-mono">1HGBH41JXMN109186</p>
								</div>
							</div>
							<span class="badge-green">Verified</span>
						</div>

						<!-- Card body — mini data preview -->
						<div class="px-6 py-5 space-y-4">
							<div>
								<p class="text-2xs uppercase tracking-widest text-ink-faint font-sans mb-1">
									Vehicle
								</p>
								<p class="text-sm font-semibold font-sans text-ink">2021 Honda Accord LX</p>
								<p class="text-xs text-ink-muted font-sans">1.5T · Automatic · FWD · Silver</p>
							</div>

							<div class="divider-dashed"></div>

							<div>
								<p class="text-2xs uppercase tracking-widest text-ink-faint font-sans mb-2">
									Import Duty Summary
								</p>
								<div class="space-y-1.5">
									{#each [{ label: 'CIF Value (USD)', value: '$12,500' }, { label: 'Import Duty (35%)', value: '₦15,312,500' }, { label: 'VAT (7.5%)', value: '₦2,109,375' }, { label: 'Port Charges', value: '₦185,000' }] as row}
										<div class="flex justify-between text-xs font-sans">
											<span class="text-ink-muted">{row.label}</span>
											<span class="font-medium text-ink tabular-nums">{row.value}</span>
										</div>
									{/each}
								</div>
								<div
									class="mt-3 pt-3 border-t border-surface-border flex justify-between items-center"
								>
									<span class="text-xs font-semibold font-sans text-ink">Total Estimate</span>
									<span class="text-sm font-bold font-sans text-gold-600 tabular-nums"
										>₦17,606,875</span
									>
								</div>
							</div>

							<div class="divider-dashed"></div>

							<div class="flex items-center gap-2">
								<svg
									class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
									viewBox="0 0 14 14"
									fill="none"
								>
									<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" />
									<path
										d="M4 7L6 9l4-4"
										stroke="currentColor"
										stroke-width="1.2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<p class="text-xs text-emerald-600 font-sans">No active safety recalls</p>
							</div>
						</div>

						<!-- Card footer -->
						<div class="px-6 py-3 bg-surface-subtle border-t border-surface-border">
							<p class="text-2xs text-ink-faint font-sans text-center">
								Based on NCS tables · CBN rate as of today
							</p>
						</div>
					</div>

					<!-- Floating badge -->
					<div
						class="absolute -top-3 -right-3 bg-ink text-white rounded-xl px-3 py-2"
					>
						<p class="text-2xs font-semibold font-sans uppercase tracking-widest">NHTSA</p>
						<p class="text-xs font-bold font-sans">Verified Data</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats bar -->
	<div class="border-t border-surface-border bg-surface-subtle">
		<div class="container-wide py-6">
			<div
				class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-surface-border"
			>
				{#each [{ value: '10,000+', label: 'Reports generated' }, { value: '₦2,500', label: 'Flat fee, no hidden charges' }, { value: '<60s', label: 'Average delivery time' }, { value: '99.2%', label: 'Data accuracy rate' }] as stat}
					<div class="stat-item md:px-8 first:pl-0 last:pr-0 text-center md:text-left">
						<span class="stat-value text-3xl">{stat.value}</span>
						<span class="stat-label text-xs mt-0.5">{stat.label}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════
     HOW IT WORKS
════════════════════════════════════════════════════════ -->
<section id="how-it-works" class="section-pad bg-white">
	<div class="container-wide">
		<div class="mb-14">
			<div class="section-rule">
				<span class="eyebrow">How it works</span>
			</div>
			<h2 class="heading-section max-w-lg">Three steps from VIN to confident decision.</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
			<!-- Connecting line (desktop) -->
			<div
				class="hidden md:block absolute top-9 left-[20%] right-[20%] h-px bg-surface-border z-0"
			></div>

			{#each [{ n: '01', title: 'Enter your VIN', desc: 'Paste or type your 17-character VIN into the form. We validate it in real time against the NHTSA database.', icon: `<path d="M5 2h6l2 3H3L5 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>` }, { n: '02', title: 'Pay securely', desc: 'Complete your ₦2,500 payment via Paystack using any card, bank transfer, or USSD. Takes under 30 seconds.', icon: `<rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 7.5h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="6" cy="10" r="1" fill="currentColor"/>` }, { n: '03', title: 'Get your report', desc: 'A detailed PDF report lands in your inbox instantly, covering specs, duty breakdown, recalls, and NCS valuation.', icon: `<rect x="3" y="2" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 5h4M6 7.5h4M6 10h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>` }] as step, i}
				<div class="card-surface relative z-10">
					<div class="flex items-start gap-4">
						<div
							class="w-9 h-9 rounded-xl border-2 border-gold-400 text-gold-500 flex items-center justify-center flex-shrink-0"
						>
							<span class="font-mono text-xs font-bold">{step.n}</span>
						</div>
						<div class="flex-1">
							<h3 class="font-sans font-semibold text-ink text-base mb-2">{step.title}</h3>
							<p class="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>


<!-- ════════════════════════════════════════════════════
     WHAT WE INSPECT
════════════════════════════════════════════════════════ -->
<section id="features" class="section-pad bg-surface-warm border-y border-surface-border">
	<div class="container-wide">
		<div class="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
			<!-- Sticky left header -->
			<div class="lg:col-span-2 lg:sticky lg:top-24">
				<div class="section-rule">
					<span class="eyebrow">What's in your report</span>
				</div>
				<h2 class="heading-section mb-5">Every detail that matters before you pay.</h2>
				<p class="body-base mb-8">
					We pull data from NHTSA, official NCS valuation tables, and OEM records so nothing is
					left out of your purchasing decision.
				</p>
				<a href="/sample-report" class="btn-ghost">
					View a sample report
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path
							d="M3 7h8M8 4.5L10.5 7 8 9.5"
							stroke="currentColor"
							stroke-width="1.4"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
			</div>

			<!-- Feature grid -->
			<div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each inspects as item}
					<div class="card group transition-colors duration-300">
						<div class="feature-icon">
							<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
								{@html item.icon}
							</svg>
						</div>
						<h4
							class="text-sm font-semibold text-ink mb-1.5 group-hover:text-gold-600 transition-colors"
						>
							{item.title}
						</h4>
						<p class="text-xs text-ink-muted leading-relaxed">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════
     PRICING
════════════════════════════════════════════════════════ -->
<section id="pricing" class="section-pad bg-white">
	<div class="container-wide">
		<div class="max-w-2xl mx-auto text-center">
			<div class="flex items-center justify-center gap-3 mb-4">
				<div class="w-6 h-px bg-gold-400"></div>
				<span class="eyebrow">Pricing</span>
				<div class="w-6 h-px bg-gold-400"></div>
			</div>
			<h2 class="heading-section mb-4">One price. Everything included.</h2>
			<p class="body-base mb-10 max-w-md mx-auto">
				No subscriptions, no upsells. Pay once per VIN and get the full report — specs, duty,
				recalls, and NCS valuation.
			</p>

			<!-- Pricing card -->
			<div class="card max-w-sm mx-auto border-2 border-ink/[0.06] relative overflow-hidden">
				<!-- Gold accent bar -->
				<div
					class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-gold-300"
				></div>

				<div class="pt-3">
					<p class="eyebrow mb-3 text-center">Single VIN Report</p>
					<div class="flex items-baseline justify-center gap-1 mb-1">
						<span class="text-5xl font-display text-ink leading-none">₦2,500</span>
					</div>
					<p class="text-xs text-ink-faint font-sans mb-8">per report · instant delivery</p>

					<ul class="text-left space-y-3 mb-8">
						{#each ['Full vehicle specifications', 'Line-by-line import duty calculation', 'NCS reference valuation', 'Active safety recall check', 'Manufacturing & origin details', 'Market compliance notes', 'PDF delivered to your email'] as feature}
							<li class="flex items-center gap-3 text-sm font-sans text-ink-soft">
								<svg
									class="w-4 h-4 text-emerald-500 flex-shrink-0"
									viewBox="0 0 16 16"
									fill="none"
								>
									<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3" />
									<path
										d="M5 8l2 2 4-4"
										stroke="currentColor"
										stroke-width="1.3"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								{feature}
							</li>
						{/each}
					</ul>

					<a href="/#vin-form" class="btn-gold w-full justify-center py-4 text-sm">
						Check a VIN Now — ₦2,500
					</a>
					<p class="text-xs text-ink-faint mt-3 font-sans">
						Secured by Paystack · All cards accepted
					</p>
				</div>
			</div>
		</div>
	</div>
</section>


<!-- ════════════════════════════════════════════════════
     TESTIMONIALS
════════════════════════════════════════════════════════ -->
<section class="section-pad bg-surface-subtle border-y border-surface-border">
	<div class="container-wide">
		<div class="mb-12 text-center">
			<div class="flex items-center justify-center gap-3 mb-4">
				<div class="w-6 h-px bg-gold-400"></div>
				<span class="eyebrow">Customer stories</span>
				<div class="w-6 h-px bg-gold-400"></div>
			</div>
			<h2 class="heading-section">Importers who got it right.</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
			{#each [{ initials: 'AO', name: 'Adebayo Okonkwo', location: 'Lagos', role: 'Private importer', quote: 'Saved me thousands. The duty calculation was exact — I used it to negotiate the final price with my clearing agent before the car even left the US.', stars: 5 }, { initials: 'CN', name: 'Chioma Nwosu', location: 'Abuja', role: 'Car dealer', quote: 'My customers ask about duties before they commit. I now send them a MotoCheck report at enquiry stage. It builds trust and closes deals faster.', stars: 5 }, { initials: 'EM', name: 'Emmanuel Musa', location: 'Port Harcourt', role: 'Fleet manager', quote: 'Bought three vehicles last quarter. MotoCheck caught an undisclosed recall on one — that alone was worth every kobo.', stars: 5 }] as t}
				<div class="testimonial-card">
					<!-- Stars -->
					<div class="flex gap-0.5">
						{#each Array(t.stars) as _}
							<svg width="14" height="14" viewBox="0 0 14 14" fill="#d4943a">
								<path d="M7 1l1.5 4H13L9.5 7.5l1.5 4L7 9.5 3 11.5l1.5-4L1 5h4.5z" />
							</svg>
						{/each}
					</div>

					<p class="text-sm text-ink-soft leading-relaxed font-sans flex-1">"{t.quote}"</p>

					<div class="flex items-center gap-3 pt-2 border-t border-surface-border">
						<div class="testimonial-avatar text-xs">
							{t.initials}
						</div>
						<div>
							<p class="text-sm font-semibold font-sans text-ink">{t.name}</p>
							<p class="text-xs text-ink-muted font-sans">{t.role} · {t.location}, Nigeria</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════
     FAQ
════════════════════════════════════════════════════════ -->
<section id="faq" class="section-pad bg-white">
	<div class="container-wide">
		<div class="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
			<div class="lg:col-span-2">
				<div class="section-rule">
					<span class="eyebrow">FAQ</span>
				</div>
				<h2 class="heading-section mb-4">Questions we hear a lot.</h2>
				<p class="body-base">
					Can't find the answer you're looking for?
					<a
						href="mailto:support@motocheck.ng"
						class="text-gold-600 hover:underline underline-offset-4">Email our support team.</a
					>
				</p>
			</div>

			<div class="lg:col-span-3">
				{#each faqs as faq, i}
					<div class="faq-item">
						<button class="faq-trigger" onclick={() => toggleFaq(i)}>
							<span>{faq.q}</span>
							<svg
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								class="flex-shrink-0 transition-transform duration-200"
								class:rotate-45={openFaq === i}
							>
								<path
									d="M9 4v10M4 9h10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
						</button>
						{#if openFaq === i}
							<div class="faq-content animate-fade-in">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════
     FINAL CTA
════════════════════════════════════════════════════════ -->
<section class="section-pad bg-ink">
	<div class="container-wide text-center">
		<div class="flex items-center justify-center gap-3 mb-5">
			<div class="w-6 h-px bg-gold-400/50"></div>
			<span class="eyebrow text-gold-400">Ready?</span>
			<div class="w-6 h-px bg-gold-400/50"></div>
		</div>

		<h2 class="heading-section text-white mb-5 max-w-xl mx-auto">
			Don't import blind.<br />
			<span class="text-gold-400">Check your VIN in seconds.</span>
		</h2>

		<p class="text-base text-white/60 font-sans font-light max-w-md mx-auto mb-10">
			Join over 10,000 Nigerian importers who use MotoCheck to verify vehicle history and
			calculate duties before committing.
		</p>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
			<a href="/#vin-form" class="btn-gold py-4 px-8 text-base">
				Check Your VIN — ₦2,500
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path
						d="M3 8h10M9 4.5L12.5 8 9 11.5"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</a>
			<a
				href="/sample-report"
				class="inline-flex items-center gap-2 text-sm font-medium font-sans text-white transition-colors"
			>
				View a sample report first
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path
						d="M3 7h8M8 4.5L10.5 7 8 9.5"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</a>
		</div>

		<div class="flex items-center justify-center gap-6 mt-8">
			{#each ['Instant delivery', 'Paystack secured', 'NHTSA verified data'] as item}
				<span class="flex items-center gap-1.5 text-xs text-white/40 font-sans">
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<circle cx="6" cy="6" r="5" stroke="#10b981" stroke-width="1.2" />
						<path
							d="M3.5 6L5 7.5 8.5 4"
							stroke="#10b981"
							stroke-width="1.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{item}
				</span>
			{/each}
		</div>
	</div>
</section>
