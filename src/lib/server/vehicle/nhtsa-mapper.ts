/**
 * NHTSA Data Mapper
 * Maps raw NHTSA API responses to our structured vehicle data types
 */

import type {
	VehicleIdentification,
	EngineSpecifications,
	TransmissionDrivetrain,
	VehicleDimensions,
	BodyInterior,
	SafetyFeatures,
	TiresWheels,
	ManufacturingInfo,
	MarketCompliance,
	ValidationInfo,
	RecallInfo
} from './types';

/**
 * Extract vehicle identification from NHTSA data
 */
export function mapIdentification(data: Map<string, string>, vin: string): VehicleIdentification {
	return {
		vin,
		make: data.get('Make') || '',
		manufacturer: data.get('Manufacturer Name') || '',
		model: data.get('Model') || '',
		modelYear: data.get('Model Year') || '',
		series: data.get('Series') || '',
		trim: data.get('Trim') || '',
		vehicleType: data.get('Vehicle Type') || ''
	};
}

/**
 * Extract engine specifications from NHTSA data
 */
export function mapEngine(data: Map<string, string>): EngineSpecifications {
	return {
		configuration: data.get('Engine Configuration') || '',
		cylinders: data.get('Engine Number of Cylinders') || '',
		displacement: data.get('Displacement (CI)') || '',
		displacementCC: data.get('Displacement (CC)') || '',
		displacementL: data.get('Displacement (L)') || '',
		model: data.get('Engine Model') || '',
		power: data.get('Engine Power (kW)') || '',
		manufacturer: data.get('Engine Manufacturer') || '',
		fuelTypePrimary: data.get('Fuel Type - Primary') || '',
		fuelTypeSecondary: data.get('Fuel Type - Secondary') || '',
		turbo: data.get('Turbo') || ''
	};
}

/**
 * Extract transmission and drivetrain from NHTSA data
 */
export function mapTransmission(data: Map<string, string>): TransmissionDrivetrain {
	return {
		transmissionStyle: data.get('Transmission Style') || '',
		transmissionSpeeds: data.get('Transmission Speeds') || '',
		driveType: data.get('Drive Type') || ''
	};
}

/**
 * Extract vehicle dimensions from NHTSA data
 */
export function mapDimensions(data: Map<string, string>): VehicleDimensions {
	return {
		doors: data.get('Doors') || '',
		windows: data.get('Windows') || '',
		wheelBase: data.get('Wheel Base Type') || '',
		wheelBaseShort: data.get('Wheel Base (inches) - Short') || '',
		wheelBaseLong: data.get('Wheel Base (inches) - Long') || '',
		gvwr: data.get('Gross Vehicle Weight Rating From') || '',
		gvwrRange: data.get('GVWR Range') || '',
		curbWeight: data.get('Curb Weight (pounds)') || '',
		bedLength: data.get('Bed Length (inches)') || '',
		cabType: data.get('Cab Type') || ''
	};
}

/**
 * Extract body and interior from NHTSA data
 */
export function mapBody(data: Map<string, string>): BodyInterior {
	return {
		bodyClass: data.get('Body Class') || '',
		numberOfSeats: data.get('Number of Seats') || '',
		numberOfSeatRows: data.get('Number of Seat Rows') || '',
		entertainmentSystem: data.get('Entertainment System') || ''
	};
}

/**
 * Extract safety features from NHTSA data
 */
export function mapSafety(data: Map<string, string>): SafetyFeatures {
	return {
		airBagLocFront: data.get('Air Bag Locations - Front') || '',
		airBagLocSide: data.get('Air Bag Locations - Side') || '',
		airBagLocCurtain: data.get('Air Bag Locations - Curtain') || '',
		airBagLocKnee: data.get('Air Bag Locations - Knee') || '',
		seatBeltsAll: data.get('Seat Belts (All Positions)') || '',
		pretensioner: data.get('Pretensioner') || '',
		abs: data.get('ABS') || '',
		esc: data.get('Electronic Stability Control (ESC)') || '',
		tractionControl: data.get('Traction Control') || '',
		brakeSystemType: data.get('Brake System Type') || '',
		brakeSystemDesc: data.get('Brake System Description') || ''
	};
}

/**
 * Extract tires and wheels from NHTSA data
 */
export function mapTires(data: Map<string, string>): TiresWheels {
	return {
		tireSize: data.get('Tire Size') || '',
		wheelSizeFront: data.get('Wheel Size Front (inches)') || '',
		wheelSizeRear: data.get('Wheel Size Rear (inches)') || ''
	};
}

/**
 * Extract manufacturing info from NHTSA data
 */
export function mapManufacturing(data: Map<string, string>): ManufacturingInfo {
	return {
		plantCity: data.get('Plant City') || '',
		plantState: data.get('Plant State') || '',
		plantCountry: data.get('Plant Country') || '',
		plantCompanyName: data.get('Plant Company Name') || '',
		manufacturerAddress: data.get('Manufacturer Address') || ''
	};
}

/**
 * Extract market and compliance from NHTSA data
 */
export function mapMarket(data: Map<string, string>): MarketCompliance {
	return {
		destinationMarket: data.get('Destination Market') || '',
		topSpeedMPH: data.get('Top Speed (MPH)') || '',
		batteryType: data.get('Battery Type') || '',
		batteryKWh: data.get('Battery Energy (kWh)') || '',
		evDriveUnit: data.get('EV Drive Unit') || ''
	};
}

/**
 * Extract validation info from NHTSA data
 */
export function mapValidation(data: Map<string, string>): ValidationInfo {
	return {
		errorCode: data.get('Error Code') || '',
		errorText: data.get('Error Text') || '',
		suggestedVIN: data.get('Suggested VIN') || '',
		note: data.get('Note') || ''
	};
}

interface RecallResult {
	Component?: string;
	Summary?: string;
	Consequence?: string;
	Remedy?: string;
	ReportReceivedDate?: string;
	NHTSACampaignNumber?: string;
}

/**
 * Map recall data to structured format
 */
export function mapRecalls(recalls: RecallResult[]): RecallInfo[] {
	return recalls.map((recall) => ({
		component: recall.Component || '',
		summary: recall.Summary || '',
		consequence: recall.Consequence || '',
		remedy: recall.Remedy || '',
		reportReceivedDate: recall.ReportReceivedDate || '',
		nhtsaCampaignNumber: recall.NHTSACampaignNumber || ''
	}));
}
