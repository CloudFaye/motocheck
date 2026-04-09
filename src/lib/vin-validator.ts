/**
 * VIN validation utilities
 * Based on ISO 3779 standard
 */

/**
 * Validates VIN format (length and allowed characters)
 */
export function isValidVIN(vin: string): boolean {
	// Must be exactly 17 characters
	if (vin.length !== 17) return false;

	// Convert to uppercase
	const vinUpper = vin.toUpperCase();

	// Check for invalid characters (I, O, Q not allowed in VINs)
	if (/[IOQ]/.test(vinUpper)) return false;

	// Must be alphanumeric
	if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vinUpper)) return false;

	return true;
}

/**
 * Sanitizes VIN input (removes spaces, converts to uppercase)
 */
export function sanitizeVIN(vin: string): string {
	return vin.replace(/\s/g, '').toUpperCase();
}

/**
 * Gets human-friendly error message for invalid VIN
 */
export function getVINError(vin: string): string | null {
	if (!vin) return 'VIN is required';

	const sanitized = sanitizeVIN(vin);

	if (sanitized.length !== 17) {
		return `VIN must be exactly 17 characters (you entered ${sanitized.length})`;
	}

	if (/[IOQ]/.test(sanitized)) {
		return 'VIN cannot contain the letters I, O, or Q';
	}

	if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(sanitized)) {
		return 'VIN can only contain letters A-Z (except I, O, Q) and numbers 0-9';
	}

	return null;
}
