<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
			await goto(resolve('/preview/[lookupId]', { lookupId: data.lookupId }));
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white">
		<div class="max-w-md space-y-6 px-4 text-center">
			<div class="relative mx-auto h-24 w-24">
				<div class="absolute inset-0 rounded-full border-4 border-gold-200"></div>
				<div
					class="absolute inset-0 animate-spin rounded-full border-4 border-gold-500 border-t-transparent"
				></div>
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
<section class="relative overflow-hidden bg-white">
	<!-- Subtle background texture -->
	<div class="pointer-events-none absolute inset-0">
		<!-- Faint grid -->
		<svg class="absolute inset-0 h-full w-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
					<path d="M 48 0 L 0 0 0 48" fill="none" stroke="#000" stroke-width="0.5" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
		<!-- Gold gradient wash, bottom-right -->
		<div
			class="absolute right-0 bottom-0 h-[500px] w-[600px] rounded-full bg-linear-to-tl from-gold-100/50 via-transparent to-transparent blur-3xl"
		></div>
	</div>

	<div class="container-wide relative z-10 pt-20 pb-24">
		<div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
			<!-- Left: copy + form -->
			<div class="animate-fade-up">
				<h1 class="heading-display mb-6">
					Know exactly what<br />
					<em class="text-gold-500 not-italic">you'll pay</em> before<br />
					your car arrives.
				</h1>

				<p class="body-lg mb-10 max-w-md">
					Enter a VIN. Get a comprehensive vehicle history, accurate NCS import duty calculation,
					and safety recall data — delivered instantly to your inbox.
				</p>

				<!-- VIN Form -->
				<form id="vin-form" onsubmit={handleSubmit} class="w-full max-w-md">
					<label class="label-base" for="vin-input">Vehicle Identification Number (VIN)</label>
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
							class="absolute top-1/2 right-4 -translate-y-1/2 font-mono text-xs font-medium tabular-nums"
							class:text-gold-500={vin.length === 17}
							class:text-ink-faint={vin.length < 17}
						>
							{vin.length}<span class="opacity-40">/17</span>
						</span>
					</div>

					<p class="mt-2 text-xs text-ink-faint">
						Found on your dashboard, door jamb, or registration document.
					</p>

					<button
						type="submit"
						class="btn-gold mt-4 w-full justify-center py-4 text-base"
						disabled={loading || vin.length !== 17}
					>
						{#if loading}
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
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
					<div class="mt-4 flex items-center gap-5">
						{#each ['Instant delivery', 'Paystack secured', '₦2,500 flat fee'] as trust (trust)}
							<span class="flex items-center gap-1.5 text-xs text-ink-muted">
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
			<div class="animate-delay-200 hidden animate-fade-up items-center justify-center lg:flex">
				<div class="relative w-full max-w-lg">
					<!-- Sample report preview card -->
					<div class="card m-0 overflow-hidden p-0 shadow-xl">
						<!-- Card header -->
						<div
							class="flex items-center justify-between border-b border-surface-border bg-white px-5 py-4"
						>
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-white">
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
									<p class="font-sans text-sm font-semibold text-ink">Vehicle Report</p>
									<p class="font-mono text-xs text-ink-faint">1HGBH41JXMN109186</p>
								</div>
							</div>
							<span class="badge-green">Verified</span>
						</div>

						<!-- Card body — mini data preview -->
						<div class="space-y-5 px-6 py-6">
							<div>
								<p class="mb-2 font-sans text-xs text-ink-faint">Vehicle</p>
								<p class="mb-1 font-sans text-base font-semibold text-ink">2021 Honda Accord LX</p>
								<p class="font-sans text-sm text-ink-muted">1.5T · Automatic · FWD · Silver</p>
							</div>

							<div class="divider"></div>

							<div>
								<p class="mb-3 font-sans text-xs text-ink-faint">Import Duty Summary</p>
								<div class="space-y-2">
									{#each [{ label: 'CIF Value (USD)', value: '$12,500' }, { label: 'Import Duty (35%)', value: '₦15,312,500' }, { label: 'VAT (7.5%)', value: '₦2,109,375' }, { label: 'Port Charges', value: '₦185,000' }] as row (row.label)}
										<div class="flex justify-between text-sm">
											<span class="text-ink-muted">{row.label}</span>
											<span class="font-medium text-ink tabular-nums">{row.value}</span>
										</div>
									{/each}
								</div>
								<div
									class="mt-4 flex items-center justify-between border-t border-surface-border pt-4"
								>
									<span class="font-sans text-sm font-semibold text-ink">Total Estimate</span>
									<span class="font-sans text-base font-bold text-gold-600 tabular-nums"
										>₦17,606,875</span
									>
								</div>
							</div>

							<div class="divider"></div>

							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 14 14" fill="none">
									<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" />
									<path
										d="M4 7L6 9l4-4"
										stroke="currentColor"
										stroke-width="1.2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								<p class="font-sans text-sm text-emerald-600">No active safety recalls</p>
							</div>
						</div>

						<!-- Card footer -->
						<div class="border-t border-surface-border bg-white px-6 py-3">
							<p class="text-center font-sans text-xs text-ink-faint">
								Based on NCS tables · CBN rate as of today
							</p>
						</div>
					</div>

					<!-- Floating badge -->
					<div class="absolute -top-3 -right-3 rounded-xl bg-ink px-4 py-2.5 text-white shadow-lg">
						<p class="font-sans text-xs font-semibold">NHTSA Verified</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats bar -->
	<div class="border-t border-surface-border bg-white">
		<div class="container-wide py-8">
			<div class="grid grid-cols-2 gap-8 divide-surface-border md:grid-cols-4 md:gap-0 md:divide-x">
				{#each [{ value: '10,000+', label: 'Reports generated' }, { value: '₦2,500', label: 'Flat fee' }, { value: '<60s', label: 'Delivery time' }, { value: '99.2%', label: 'Accuracy rate' }] as stat (stat.label)}
					<div class="stat-item text-center first:pl-0 last:pr-0 md:px-8 md:text-left">
						<span class="stat-value text-3xl">{stat.value}</span>
						<span class="stat-label mt-1 text-sm">{stat.label}</span>
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

		<div class="relative grid grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Connecting line (desktop) -->
			<div
				class="absolute top-9 right-[20%] left-[20%] z-0 hidden h-px bg-surface-border md:block"
			></div>

			{#each [{ n: '01', title: 'Enter your VIN', desc: 'Paste or type your 17-character VIN into the form. We validate it in real time against the NHTSA database.', icon: `<path d="M5 2h6l2 3H3L5 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>` }, { n: '02', title: 'Pay securely', desc: 'Complete your ₦2,500 payment via Paystack using any card, bank transfer, or USSD. Takes under 30 seconds.', icon: `<rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 7.5h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="6" cy="10" r="1" fill="currentColor"/>` }, { n: '03', title: 'Get your report', desc: 'A detailed PDF report lands in your inbox instantly, covering specs, duty breakdown, recalls, and NCS valuation.', icon: `<rect x="3" y="2" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 5h4M6 7.5h4M6 10h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>` }] as step (step.n)}
				<div class="card-surface relative z-10">
					<div class="flex items-start gap-4">
						<div
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-gold-400 text-gold-500"
						>
							<span class="font-mono text-xs font-bold">{step.n}</span>
						</div>
						<div class="flex-1">
							<h3 class="mb-2 text-base font-semibold text-ink">{step.title}</h3>
							<p class="text-sm leading-relaxed text-ink-muted">{step.desc}</p>
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
<section id="features" class="section-pad border-y border-surface-border bg-white">
	<div class="container-wide">
		<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-5 lg:gap-16">
			<!-- Sticky left header -->
			<div class="lg:sticky lg:top-24 lg:col-span-2">
				<div class="section-rule">
					<span class="eyebrow">What's in your report</span>
				</div>
				<h2 class="heading-section mb-5">Every detail that matters before you pay.</h2>
				<p class="body-base mb-8">
					We pull data from NHTSA, official NCS valuation tables, and OEM records so nothing is left
					out of your purchasing decision.
				</p>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/sample-report" data-sveltekit-preload-data class="btn-ghost">
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
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
				{#each inspects as item (item.title)}
					<div class="card group transition-colors duration-300">
						<div class="feature-icon">
							<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html item.icon}
							</svg>
						</div>
						<h4
							class="mb-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-gold-600"
						>
							{item.title}
						</h4>
						<p class="text-xs leading-relaxed text-ink-muted">{item.desc}</p>
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
		<div class="mx-auto max-w-2xl text-center">
			<div class="mb-4 flex items-center justify-center gap-3">
				<div class="h-px w-6 bg-gold-400"></div>
				<span class="eyebrow">Pricing</span>
				<div class="h-px w-6 bg-gold-400"></div>
			</div>
			<h2 class="heading-section mb-4">One price. Everything included.</h2>
			<p class="body-base mx-auto mb-10 max-w-md">
				No subscriptions, no upsells. Pay once per VIN and get the full report — specs, duty,
				recalls, and NCS valuation.
			</p>

			<!-- Pricing card -->
			<div class="card relative mx-auto max-w-sm overflow-hidden border-2 border-ink/6">
				<!-- Gold accent bar -->
				<div
					class="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-gold-400 to-gold-300"
				></div>

				<div class="pt-3">
					<p class="eyebrow mb-3 text-center">Single VIN Report</p>
					<div class="mb-1 flex items-baseline justify-center gap-1">
						<span class="font-display text-5xl leading-none text-ink">₦2,500</span>
					</div>
					<p class="mb-8 font-sans text-xs text-ink-faint">per report · instant delivery</p>

					<ul class="mb-8 space-y-3 text-left">
						{#each ['Full vehicle specifications', 'Line-by-line import duty calculation', 'NCS reference valuation', 'Active safety recall check', 'Manufacturing & origin details', 'Market compliance notes', 'PDF delivered to your email'] as feature (feature)}
							<li class="flex items-center gap-3 text-sm text-ink-soft">
								<svg class="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none">
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

					<a
						href="#vin-form"
						data-sveltekit-preload-data
						class="btn-gold w-full justify-center py-4 text-sm"
					>
						Check a VIN Now — ₦2,500
					</a>
					<p class="mt-3 text-xs text-ink-faint">Secured by Paystack · All cards accepted</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════
     TESTIMONIALS
════════════════════════════════════════════════════════ -->
<section class="section-pad border-y border-surface-border bg-white">
	<div class="container-wide">
		<div class="mb-12 text-center">
			<div class="mb-4 flex items-center justify-center gap-3">
				<div class="h-px w-6 bg-gold-400"></div>
				<span class="eyebrow">Customer stories</span>
				<div class="h-px w-6 bg-gold-400"></div>
			</div>
			<h2 class="heading-section">Importers who got it right.</h2>
		</div>

		<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
			{#each [{ initials: 'AO', name: 'Adebayo Okonkwo', location: 'Lagos', role: 'Private importer', quote: 'Saved me thousands. The duty calculation was exact — I used it to negotiate the final price with my clearing agent before the car even left the US.', stars: 5 }, { initials: 'CN', name: 'Chioma Nwosu', location: 'Abuja', role: 'Car dealer', quote: 'My customers ask about duties before they commit. I now send them a MotoCheck report at enquiry stage. It builds trust and closes deals faster.', stars: 5 }, { initials: 'EM', name: 'Emmanuel Musa', location: 'Port Harcourt', role: 'Fleet manager', quote: 'Bought three vehicles last quarter. MotoCheck caught an undisclosed recall on one — that alone was worth every kobo.', stars: 5 }] as t (t.name)}
				<div class="testimonial-card">
					<!-- Stars -->
					<div class="flex gap-0.5">
						<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
						{#each Array(t.stars) as _star, starIndex (starIndex)}
							<svg width="14" height="14" viewBox="0 0 14 14" fill="#d4943a">
								<path d="M7 1l1.5 4H13L9.5 7.5l1.5 4L7 9.5 3 11.5l1.5-4L1 5h4.5z" />
							</svg>
						{/each}
					</div>

					<p class="flex-1 text-sm leading-relaxed text-ink-soft">"{t.quote}"</p>

					<div class="flex items-center gap-3 border-t border-surface-border pt-2">
						<div class="testimonial-avatar text-xs">
							{t.initials}
						</div>
						<div>
							<p class="text-sm font-semibold text-ink">{t.name}</p>
							<p class="text-xs text-ink-muted">{t.role} · {t.location}, Nigeria</p>
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
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
			<div class="lg:col-span-2">
				<div class="section-rule">
					<span class="eyebrow">FAQ</span>
				</div>
				<h2 class="heading-section mb-4">Questions we hear a lot.</h2>
				<p class="body-base">
					Can't find the answer you're looking for?
					<a
						href="mailto:support@motocheck.ng"
						class="text-gold-600 underline-offset-4 hover:underline">Email our support team.</a
					>
				</p>
			</div>

			<div class="lg:col-span-3">
				{#each faqs as faq, faqIndex (faq.q)}
					<div class="faq-item">
						<button class="faq-trigger" onclick={() => toggleFaq(faqIndex)}>
							<span>{faq.q}</span>
							<svg
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								class="shrink-0 transition-transform duration-200"
								class:rotate-45={openFaq === faqIndex}
							>
								<path
									d="M9 4v10M4 9h10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
						</button>
						{#if openFaq === faqIndex}
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
		<div class="mb-5 flex items-center justify-center gap-3">
			<div class="h-px w-6 bg-gold-400/50"></div>
			<span class="eyebrow text-gold-400">Ready?</span>
			<div class="h-px w-6 bg-gold-400/50"></div>
		</div>

		<h2 class="heading-section mx-auto mb-5 max-w-xl text-white">
			Don't import blind.<br />
			<span class="text-gold-400">Check your VIN in seconds.</span>
		</h2>

		<p class="mx-auto mb-10 max-w-md font-sans text-base font-light text-white/60">
			Join over 10,000 Nigerian importers who use MotoCheck to verify vehicle history and calculate
			duties before committing.
		</p>

		<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/#vin-form" data-sveltekit-preload-data class="btn-gold px-8 py-4 text-base">
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
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/sample-report"
				data-sveltekit-preload-data
				class="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors"
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

		<div class="mt-8 flex items-center justify-center gap-6">
			{#each ['Instant delivery', 'Paystack secured', 'NHTSA verified data'] as item (item)}
				<span class="flex items-center gap-1.5 text-xs text-white/40">
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
