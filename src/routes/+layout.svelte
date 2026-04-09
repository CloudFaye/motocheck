<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
	let mobileOpen = $state(false);

	const navLinks = [
		{ path: '/sample-report', label: 'Sample Report' },
		{ path: '/#how-it-works', label: 'How It Works' },
		{ path: '/#faq', label: 'FAQ' }
	] as const;
	const productLinks = [
		{ path: '/#vin-form', label: 'Check a VIN' },
		{ path: '/sample-report', label: 'Sample Report' },
		{ path: '/#how-it-works', label: 'How It Works' },
		{ path: '/#pricing', label: 'Pricing' }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster position="top-center" />

<!-- ════════════════════════ NAV ════════════════════════ -->
<header class="fixed top-0 right-0 left-0 z-50 bg-white/90 backdrop-blur-sm">
	<div class="container-wide">
		<nav class="flex h-16 items-center justify-between gap-6">
			<!-- Logo -->
			<a href={resolve('/')} class="group flex flex-shrink-0 items-center gap-2.5">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-ink transition-transform duration-200 group-hover:scale-105"
				>
					<!-- Minimal car icon mark -->
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
				<span class="font-sans text-sm font-semibold tracking-tight text-ink">MotoCheck</span>
			</a>

			<!-- Desktop links -->
			<ul class="hidden items-center gap-7 md:flex">
				{#each navLinks as link (link.path)}
					<li>
						<a href={resolve(link.path)} class="nav-link pb-px">
							{link.label}
						</a>
					</li>
				{/each}
			</ul>

			<!-- CTA -->
			<div class="hidden items-center gap-3 md:flex">
				<a href={resolve('/#vin-form')} class="btn-gold px-5 py-2.5 text-xs">
					Check VIN
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

			<!-- Mobile hamburger -->
			<button
				class="rounded-lg p-2 transition-colors hover:bg-surface-subtle md:hidden"
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Toggle menu"
			>
				{#if mobileOpen}
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path
							d="M4 4L14 14M14 4L4 14"
							stroke="#0f0f0f"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
				{:else}
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path
							d="M3 5h12M3 9h12M3 13h12"
							stroke="#0f0f0f"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
				{/if}
			</button>
		</nav>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="animate-fade-in border-t border-surface-border bg-white md:hidden">
			<div class="container-wide flex flex-col gap-1 py-4">
				{#each navLinks as link (link.path)}
					<a
						href={resolve(link.path)}
						class="rounded-lg px-3 py-2.5 font-sans text-sm font-medium text-ink-soft transition-all hover:bg-surface-subtle hover:text-ink"
						onclick={() => (mobileOpen = false)}
					>
						{link.label}
					</a>
				{/each}
				<div class="mt-2 border-t border-surface-border pt-3">
					<a
						href={resolve('/#vin-form')}
						class="btn-gold w-full justify-center"
						onclick={() => (mobileOpen = false)}
					>
						Check VIN Now
					</a>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- ═══════════════════ PAGE CONTENT ═══════════════════ -->
<main class="min-h-screen pt-16">
	{@render children()}
</main>

<!-- ════════════════════════ FOOTER ════════════════════════ -->
<footer class="mt-auto border-t border-surface-border bg-surface-subtle">
	<!-- Main footer -->
	<div class="container-wide py-16">
		<div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
			<!-- Brand column -->
			<div class="lg:col-span-1">
				<a href={resolve('/')} class="mb-4 flex items-center gap-2.5">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
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
					<span class="font-sans text-sm font-semibold text-ink">MotoCheck</span>
				</a>
				<p class="mb-5 max-w-xs text-sm leading-relaxed text-ink-muted">
					Nigeria's trusted platform for vehicle history reports and import duty calculations.
				</p>
				<!-- Trust marks -->
				<div class="flex items-center gap-2">
					<span class="badge-neutral">NHTSA Verified</span>
					<span class="badge-green">NCS Data</span>
				</div>
			</div>

			<!-- Product -->
			<div>
				<h6 class="eyebrow mb-5">Product</h6>
				<ul class="flex flex-col gap-3">
					{#each productLinks as link (link.path)}
						<li>
							<a
								href={resolve(link.path)}
								class="font-sans text-sm text-ink-muted transition-colors hover:text-ink"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Support -->
			<div>
				<h6 class="eyebrow mb-5">Support</h6>
				<ul class="flex flex-col gap-3">
					<li>
						<a
							href={resolve('/#faq')}
							class="font-sans text-sm text-ink-muted transition-colors hover:text-ink"
						>
							FAQ
						</a>
					</li>
					<li>
						<a
							href="mailto:support@motocheck.ng"
							class="font-sans text-sm text-ink-muted transition-colors hover:text-ink"
						>
							Email Support
						</a>
					</li>
					<li>
						<a
							href={resolve('/sample-report')}
							class="font-sans text-sm text-ink-muted transition-colors hover:text-ink"
						>
							View Sample Report
						</a>
					</li>
				</ul>
			</div>

			<!-- Contact -->
			<div>
				<h6 class="eyebrow mb-5">Get in touch</h6>
				<ul class="flex flex-col gap-3">
					<li class="flex items-start gap-3">
						<svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-400" viewBox="0 0 16 16" fill="none">
							<rect
								x="2"
								y="4"
								width="12"
								height="9"
								rx="1.5"
								stroke="currentColor"
								stroke-width="1.3"
							/>
							<path
								d="M2 5.5L8 9.5l6-4"
								stroke="currentColor"
								stroke-width="1.3"
								stroke-linecap="round"
							/>
						</svg>
						<a
							href="mailto:support@motocheck.ng"
							class="text-sm text-ink-muted transition-colors hover:text-ink"
						>
							support@motocheck.ng
						</a>
					</li>
					<li class="flex items-start gap-3">
						<svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-400" viewBox="0 0 16 16" fill="none">
							<path
								d="M13 10.5c-1 0-2-.5-2.5-1l-1.5 1.5C7 9.5 6.5 9 5 7l1.5-1.5C6 5 5.5 4 5.5 3H3C3 9.5 6.5 13 13 13v-2.5z"
								stroke="currentColor"
								stroke-width="1.3"
								stroke-linejoin="round"
							/>
						</svg>
						<span class="text-sm text-ink-muted">+234 XXX XXX XXXX</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-400" viewBox="0 0 16 16" fill="none">
							<path
								d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z"
								stroke="currentColor"
								stroke-width="1.3"
							/>
							<circle cx="8" cy="6" r="1.5" stroke="currentColor" stroke-width="1.3" />
						</svg>
						<span class="text-sm text-ink-muted">Lagos, Nigeria</span>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Bottom bar -->
	<div class="border-t border-surface-border">
		<div class="container-wide flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
			<p class="font-sans text-xs text-ink-faint">
				© {new Date().getFullYear()} MotoCheck. All rights reserved.
			</p>
			<div class="flex items-center gap-1 font-sans text-xs text-ink-faint">
				<span>Payments secured by</span>
				<span class="ml-1 font-semibold text-ink-muted">Paystack</span>
				<span class="mx-2 opacity-30">·</span>
				<span>Data from</span>
				<span class="ml-1 font-semibold text-ink-muted">NHTSA & NCS</span>
			</div>
		</div>
	</div>
</footer>
