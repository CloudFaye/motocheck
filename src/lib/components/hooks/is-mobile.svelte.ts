/**
 * IsMobile hook - Detects if the viewport is mobile-sized
 * Uses Svelte 5 runes for reactivity
 */

export class IsMobile {
	current = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			this.current = window.innerWidth < 768;

			$effect(() => {
				const handleResize = () => {
					this.current = window.innerWidth < 768;
				};

				window.addEventListener('resize', handleResize);

				return () => {
					window.removeEventListener('resize', handleResize);
				};
			});
		}
	}
}
