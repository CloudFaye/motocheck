<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  let mobileOpen = false;

  const navLinks = [
    { href: '/sample-report',  label: 'Sample Report' },
    { href: '/#how-it-works',  label: 'How It Works'  },
    { href: '/#faq',           label: 'FAQ'            },
  ];
</script>

<!-- ════════════════════════ NAV ════════════════════════ -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-surface-border">
  <div class="container-wide">
    <nav class="h-16 flex items-center justify-between gap-6">

      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 flex-shrink-0 group">
        <div class="w-8 h-8 rounded-lg bg-ink flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <!-- Minimal car icon mark -->
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-white">
            <path d="M3 9.5L4.5 5.5h7L13 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="2" y="9.5" width="12" height="3.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="5" cy="13.5" r="1" fill="currentColor"/>
            <circle cx="11" cy="13.5" r="1" fill="currentColor"/>
          </svg>
        </div>
        <span class="font-sans font-semibold text-ink text-sm tracking-tight">MotoCheck</span>
      </a>

      <!-- Desktop links -->
      <ul class="hidden md:flex items-center gap-7">
        {#each navLinks as link}
          <li>
            <a href={link.href} class="nav-link pb-px">
              {link.label}
            </a>
          </li>
        {/each}
      </ul>

      <!-- CTA -->
      <div class="hidden md:flex items-center gap-3">
        <a href="/#vin-form" class="btn-gold text-xs px-5 py-2.5">
          Check VIN
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4.5L10.5 7 8 9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-2 rounded-lg hover:bg-surface-subtle transition-colors"
        on:click={() => mobileOpen = !mobileOpen}
        aria-label="Toggle menu"
      >
        {#if mobileOpen}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="#0f0f0f" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="#0f0f0f" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        {/if}
      </button>

    </nav>
  </div>

  <!-- Mobile menu -->
  {#if mobileOpen}
    <div class="md:hidden border-t border-surface-border bg-white animate-fade-in">
      <div class="container-wide py-4 flex flex-col gap-1">
        {#each navLinks as link}
          <a
            href={link.href}
            class="px-3 py-2.5 rounded-lg text-sm font-medium font-sans text-ink-soft hover:text-ink hover:bg-surface-subtle transition-all"
            on:click={() => mobileOpen = false}
          >
            {link.label}
          </a>
        {/each}
        <div class="pt-3 mt-2 border-t border-surface-border">
          <a href="/#vin-form" class="btn-gold w-full justify-center" on:click={() => mobileOpen = false}>
            Check VIN Now
          </a>
        </div>
      </div>
    </div>
  {/if}
</header>

<!-- ═══════════════════ PAGE CONTENT ═══════════════════ -->
<main class="pt-16 min-h-screen">
  <slot />
</main>

<!-- ════════════════════════ FOOTER ════════════════════════ -->
<footer class="bg-surface-subtle border-t border-surface-border mt-auto">

  <!-- Main footer -->
  <div class="container-wide py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

      <!-- Brand column -->
      <div class="lg:col-span-1">
        <a href="/" class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-white">
              <path d="M3 9.5L4.5 5.5h7L13 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="2" y="9.5" width="12" height="3.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="5" cy="13.5" r="1" fill="currentColor"/>
              <circle cx="11" cy="13.5" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span class="font-sans font-semibold text-ink text-sm">MotoCheck</span>
        </a>
        <p class="text-sm text-ink-muted leading-relaxed max-w-xs mb-5">
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
          {#each [
            { href: '/#vin-form',     label: 'Check a VIN'     },
            { href: '/sample-report', label: 'Sample Report'   },
            { href: '/#how-it-works', label: 'How It Works'    },
            { href: '/#pricing',      label: 'Pricing'         },
          ] as link}
            <li>
              <a href={link.href} class="text-sm text-ink-muted hover:text-ink transition-colors font-sans">
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
          {#each [
            { href: '/#faq',           label: 'FAQ'             },
            { href: '/contact',        label: 'Contact Us'      },
            { href: '/privacy-policy', label: 'Privacy Policy'  },
            { href: '/terms',          label: 'Terms of Service'},
          ] as link}
            <li>
              <a href={link.href} class="text-sm text-ink-muted hover:text-ink transition-colors font-sans">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Contact -->
      <div>
        <h6 class="eyebrow mb-5">Get in touch</h6>
        <ul class="flex flex-col gap-3">
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M2 5.5L8 9.5l6-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <a href="mailto:support@motocheck.ng" class="text-sm text-ink-muted hover:text-ink transition-colors">
              support@motocheck.ng
            </a>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M13 10.5c-1 0-2-.5-2.5-1l-1.5 1.5C7 9.5 6.5 9 5 7l1.5-1.5C6 5 5.5 4 5.5 3H3C3 9.5 6.5 13 13 13v-2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            <span class="text-sm text-ink-muted">+234 XXX XXX XXXX</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="8" cy="6" r="1.5" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            <span class="text-sm text-ink-muted">Lagos, Nigeria</span>
          </li>
        </ul>
      </div>

    </div>
  </div>

  <!-- Bottom bar -->
  <div class="border-t border-surface-border">
    <div class="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="text-xs text-ink-faint font-sans">
        © {new Date().getFullYear()} MotoCheck. All rights reserved.
      </p>
      <div class="flex items-center gap-1 text-xs text-ink-faint font-sans">
        <span>Payments secured by</span>
        <span class="font-semibold text-ink-muted ml-1">Paystack</span>
        <span class="mx-2 opacity-30">·</span>
        <span>Data from</span>
        <span class="font-semibold text-ink-muted ml-1">NHTSA & NCS</span>
      </div>
    </div>
  </div>

</footer>
