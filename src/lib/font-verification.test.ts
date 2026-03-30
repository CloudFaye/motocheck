/**
 * Font Loading Verification Tests
 * Task 3.1: Verify Google Fonts load correctly
 * 
 * Sub-tasks:
 * - 3.1.1 Check Instrument Serif loads for headings
 * - 3.1.2 Check DM Sans loads for body text
 * - 3.1.3 Verify font fallbacks work
 * - 3.1.4 Test font rendering in different browsers
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Task 3.1: Font Loading Verification', () => {
	const layoutCssPath = join(process.cwd(), 'src/routes/layout.css');
	const layoutCss = readFileSync(layoutCssPath, 'utf-8');

	describe('3.1.1: Instrument Serif for Headings', () => {
		it('should import Instrument Serif from Google Fonts', () => {
			expect(layoutCss).toContain('Instrument+Serif');
			expect(layoutCss).toContain('fonts.googleapis.com');
		});

		it('should define Instrument Serif in font-display variable', () => {
			expect(layoutCss).toContain("--font-display: 'Instrument Serif'");
		});

		it('should include italic variant for Instrument Serif', () => {
			expect(layoutCss).toMatch(/Instrument\+Serif.*ital/);
		});

		it('should use font-display swap for performance', () => {
			expect(layoutCss).toContain('display=swap');
		});

		it('should define heading-display class using Instrument Serif', () => {
			expect(layoutCss).toContain('.heading-display');
			expect(layoutCss).toMatch(/\.heading-display[\s\S]*font-family.*var\(--font-display\)/);
		});

		it('should define heading-section class using Instrument Serif', () => {
			expect(layoutCss).toContain('.heading-section');
			expect(layoutCss).toMatch(/\.heading-section[\s\S]*font-family.*var\(--font-display\)/);
		});

		it('should use clamp() for responsive heading sizes', () => {
			expect(layoutCss).toMatch(/--font-size-display:.*clamp/);
			expect(layoutCss).toMatch(/--font-size-display-sm:.*clamp/);
		});
	});

	describe('3.1.2: DM Sans for Body Text', () => {
		it('should import DM Sans from Google Fonts', () => {
			expect(layoutCss).toContain('DM+Sans');
			expect(layoutCss).toContain('fonts.googleapis.com');
		});

		it('should define DM Sans in font-sans variable', () => {
			expect(layoutCss).toContain("--font-sans: 'DM Sans'");
		});

		it('should include multiple weights for DM Sans (300, 400, 500, 600)', () => {
			const dmSansImport = layoutCss.match(/DM\+Sans[^'"]*/)?.[0] || '';
			expect(dmSansImport).toContain('300');
			expect(dmSansImport).toContain('400');
			expect(dmSansImport).toContain('500');
			expect(dmSansImport).toContain('600');
		});

		it('should include italic variant for DM Sans', () => {
			expect(layoutCss).toMatch(/DM\+Sans.*ital/);
		});

		it('should define body-lg class using DM Sans', () => {
			expect(layoutCss).toContain('.body-lg');
			expect(layoutCss).toMatch(/\.body-lg[\s\S]*font-family.*var\(--font-sans\)/);
		});

		it('should define body-base class using DM Sans', () => {
			expect(layoutCss).toContain('.body-base');
			expect(layoutCss).toMatch(/\.body-base[\s\S]*font-family.*var\(--font-sans\)/);
		});

		it('should set body element to use DM Sans', () => {
			expect(layoutCss).toMatch(/body[\s\S]*font-family.*var\(--font-sans\)/);
		});
	});

	describe('3.1.2 (Bonus): IBM Plex Mono for VIN Display', () => {
		it('should import IBM Plex Mono from Google Fonts', () => {
			expect(layoutCss).toContain('IBM+Plex+Mono');
			expect(layoutCss).toContain('fonts.googleapis.com');
		});

		it('should define IBM Plex Mono in font-mono variable', () => {
			expect(layoutCss).toContain("--font-mono: 'IBM Plex Mono'");
		});

		it('should include weights 400 and 500 for IBM Plex Mono', () => {
			const monoImport = layoutCss.match(/IBM\+Plex\+Mono[^'"]*/)?.[0] || '';
			expect(monoImport).toContain('400');
			expect(monoImport).toContain('500');
		});

		it('should define input-lg class using IBM Plex Mono', () => {
			expect(layoutCss).toContain('.input-lg');
			expect(layoutCss).toMatch(/\.input-lg[\s\S]*font-family.*var\(--font-mono\)/);
		});
	});

	describe('3.1.3: Font Fallbacks', () => {
		it('should define Georgia as fallback for Instrument Serif', () => {
			expect(layoutCss).toMatch(/--font-display:.*Georgia.*serif/);
		});

		it('should define system-ui as fallback for DM Sans', () => {
			expect(layoutCss).toMatch(/--font-sans:.*system-ui.*sans-serif/);
		});

		it('should define monospace as fallback for IBM Plex Mono', () => {
			expect(layoutCss).toMatch(/--font-mono:.*monospace/);
		});

		it('should include IBM Plex Sans as intermediate fallback for DM Sans', () => {
			expect(layoutCss).toMatch(/--font-sans:.*'IBM Plex Sans'/);
		});
	});

	describe('3.1.4: Font Rendering Configuration', () => {
		it('should enable font smoothing for webkit browsers', () => {
			expect(layoutCss).toContain('-webkit-font-smoothing: antialiased');
		});

		it('should enable font smoothing for Firefox', () => {
			expect(layoutCss).toContain('-moz-osx-font-smoothing: grayscale');
		});

		it('should optimize text rendering', () => {
			expect(layoutCss).toContain('text-rendering: optimizeLegibility');
		});

		it('should use font-display swap for all font imports', () => {
			const fontImports = layoutCss.match(/@import url\([^)]+\)/g) || [];
			const googleFontImports = fontImports.filter(imp => imp.includes('fonts.googleapis.com'));
			
			googleFontImports.forEach(imp => {
				expect(imp).toContain('display=swap');
			});
		});
	});

	describe('Font Loading Performance', () => {
		it('should use @import for font loading', () => {
			expect(layoutCss).toMatch(/@import url\(['"]https:\/\/fonts\.googleapis\.com/);
		});

		it('should load all fonts from Google Fonts CDN', () => {
			const fontImports = layoutCss.match(/@import url\([^)]+\)/g) || [];
			const googleFontImports = fontImports.filter(imp => imp.includes('fonts.googleapis.com'));
			
			expect(googleFontImports.length).toBeGreaterThanOrEqual(3); // At least 3 fonts
		});

		it('should place font imports before Tailwind directives', () => {
			const fontImportIndex = layoutCss.indexOf('@import url');
			const tailwindIndex = layoutCss.indexOf('@import \'tailwindcss\'');
			
			expect(fontImportIndex).toBeLessThan(tailwindIndex);
		});
	});

	describe('Typography Classes', () => {
		it('should define all required typography classes', () => {
			const requiredClasses = [
				'.heading-display',
				'.heading-section',
				'.eyebrow',
				'.body-lg',
				'.body-base'
			];

			requiredClasses.forEach(className => {
				expect(layoutCss).toContain(className);
			});
		});

		it('should use proper letter-spacing for display headings', () => {
			expect(layoutCss).toMatch(/--font-size-display--letter-spacing:.*-0\.02em/);
		});

		it('should use proper line-height for display headings', () => {
			expect(layoutCss).toMatch(/--font-size-display--line-height:.*1\.08/);
		});
	});

	describe('CSS Custom Properties', () => {
		it('should define font family custom properties in @theme', () => {
			expect(layoutCss).toContain('--font-display:');
			expect(layoutCss).toContain('--font-sans:');
			expect(layoutCss).toContain('--font-mono:');
		});

		it('should define font size custom properties', () => {
			expect(layoutCss).toContain('--font-size-display:');
			expect(layoutCss).toContain('--font-size-display-sm:');
		});
	});
});

describe('Integration: Font Usage in Components', () => {
	it('should verify h1, h2, h3 use display font family', () => {
		expect(layoutCss).toMatch(/h1, h2, h3[\s\S]*font-family.*var\(--font-display\)/);
	});

	it('should verify h4, h5, h6 use sans font family', () => {
		expect(layoutCss).toMatch(/h4, h5, h6[\s\S]*font-family.*var\(--font-sans\)/);
	});

	it('should verify body uses sans font family', () => {
		expect(layoutCss).toMatch(/body[\s\S]*font-family.*var\(--font-sans\)/);
	});
});
