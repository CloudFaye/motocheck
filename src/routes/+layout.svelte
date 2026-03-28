<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster position="top-center" />

<nav class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2">
			<svg class="w-7 h-7 md:w-8 md:h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
				<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
			</svg>
			<span class="font-bold text-lg md:text-xl">MotoCheck</span>
		</a>

		<div class="flex items-center gap-3 md:gap-6">
			<a href="/sample-report" class="text-sm font-medium hover:text-primary transition-colors">
				Sample
			</a>
			<a href="/#how-it-works" class="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
				How It Works
			</a>
			<Button href="/" size="sm" class="h-9 px-4">
				Check VIN
			</Button>
		</div>
	</div>
</nav>

<main>
	{@render children()}
</main>

