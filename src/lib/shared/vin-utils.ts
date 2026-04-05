// VIN validation utilities

export interface VINValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validates a VIN (Vehicle Identification Number)
 * 
 * Rules:
 * - Must be exactly 17 characters
 * - Must be alphanumeric
 * - Cannot contain I, O, or Q (to avoid confusion with 1, 0)
 * 
 * @param vin - The VIN to validate
 * @returns Validation result with error message if invalid
 */
export function validateVIN(vin: string): VINValidationResult {
	// Check length
	if (vin.length !== 17) {
		return {
			valid: false,
			error: 'VIN must be exactly 17 characters'
		};
	}

	// Check for invalid characters (I, O, Q not allowed in VINs)
	if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) {
		return {
			valid: false,
			error: 'VIN contains invalid characters (I, O, Q not allowed)'
		};
	}

	return { valid: true };
}

/**
 * Normalizes a VIN by converting to uppercase and trimming whitespace
 * 
 * @param vin - The VIN to normalize
 * @returns Normalized VIN
 */
export function normalizeVIN(vin: string): string {
	return vin.trim().toUpperCase();
}
