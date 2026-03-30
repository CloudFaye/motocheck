/**
 * Vehicle data type definitions
 * Centralized types for vehicle information across all data sources
 */

export interface VehicleIdentification {
	vin: string;
	make: string;
	manufacturer: string;
	model: string;
	modelYear: string;
	series: string;
	trim: string;
	vehicleType: string;
}

export interface EngineSpecifications {
	configuration: string;
	cylinders: string;
	displacement: string;
	displacementCC: string;
	displacementL: string;
	model: string;
	power: string;
	manufacturer: string;
	fuelTypePrimary: string;
	fuelTypeSecondary: string;
	turbo: string;
}

export interface TransmissionDrivetrain {
	transmissionStyle: string;
	transmissionSpeeds: string;
	driveType: string;
}

export interface VehicleDimensions {
	doors: string;
	windows: string;
	wheelBase: string;
	wheelBaseShort: string;
	wheelBaseLong: string;
	gvwr: string;
	gvwrRange: string;
	curbWeight: string;
	bedLength: string;
	cabType: string;
}

export interface BodyInterior {
	bodyClass: string;
	numberOfSeats: string;
	numberOfSeatRows: string;
	entertainmentSystem: string;
}

export interface SafetyFeatures {
	airBagLocFront: string;
	airBagLocSide: string;
	airBagLocCurtain: string;
	airBagLocKnee: string;
	seatBeltsAll: string;
	pretensioner: string;
	abs: string;
	esc: string;
	tractionControl: string;
	brakeSystemType: string;
	brakeSystemDesc: string;
}

export interface TiresWheels {
	tireSize: string;
	wheelSizeFront: string;
	wheelSizeRear: string;
}

export interface ManufacturingInfo {
	plantCity: string;
	plantState: string;
	plantCountry: string;
	plantCompanyName: string;
	manufacturerAddress: string;
}

export interface MarketCompliance {
	destinationMarket: string;
	topSpeedMPH: string;
	batteryType: string;
	batteryKWh: string;
	evDriveUnit: string;
}

export interface ValidationInfo {
	errorCode: string;
	errorText: string;
	suggestedVIN: string;
	note: string;
}

export interface RecallInfo {
	component: string;
	summary: string;
	consequence: string;
	remedy: string;
	reportReceivedDate: string;
	nhtsaCampaignNumber: string;
}

/**
 * Complete vehicle data aggregated from all sources
 */
export interface ComprehensiveVehicleData {
	identification: VehicleIdentification;
	engine: EngineSpecifications;
	transmission: TransmissionDrivetrain;
	dimensions: VehicleDimensions;
	body: BodyInterior;
	safety: SafetyFeatures;
	tires: TiresWheels;
	manufacturing: ManufacturingInfo;
	market: MarketCompliance;
	validation: ValidationInfo;
	recalls: RecallInfo[];
}
