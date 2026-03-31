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
	
	// New comprehensive fields (all optional for backward compatibility)
	images?: ImageResult[];
	ownership?: OwnershipHistory;
	sales?: SaleHistory;
	odometer?: OdometerHistory;
	titleHistory?: TitleHistory;
	inspections?: InspectionHistory;
	insurance?: InsuranceHistory;
	junkSalvage?: JunkSalvageInfo;
	accidents?: AccidentHistory;
	lienImpound?: LienImpoundHistory;
	theft?: TheftHistory;
	titleBrands?: TitleBrands;
	marketValue?: MarketValue;
	warranty?: WarrantyInfo;
}

/**
 * Image result from vehicle image aggregation service
 */
export interface ImageResult {
	url: string;
	source: 'auction' | 'dealer' | 'google' | 'duckduckgo' | 'placeholder';
	matchType: 'vin-exact' | 'stock' | 'placeholder';
	confidence: number;
	metadata: {
		date?: string;
		location?: string;
		description?: string;
	};
}

/**
 * Ownership history data structures
 */
export interface OwnershipHistory {
	numberOfOwners?: number;
	owners: OwnershipRecord[];
}

export interface OwnershipRecord {
	ownerNumber: number;
	startDate?: string;
	endDate?: string;
	state?: string;
	country?: string;
	durationMonths?: number;
}

/**
 * Sale history data structures
 */
export interface SaleHistory {
	sales: SaleRecord[];
}

export interface SaleRecord {
	date: string;
	price?: number;
	currency?: string;
	location?: string;
	saleType: 'dealer' | 'private' | 'auction' | 'unknown';
	source?: string;
}

/**
 * Odometer history data structures
 */
export interface OdometerHistory {
	readings: OdometerReading[];
	rollbackDetected: boolean;
}

export interface OdometerReading {
	date: string;
	mileage: number;
	source: string;
	verified: boolean;
}

/**
 * Title history data structures
 */
export interface TitleHistory {
	records: TitleRecord[];
}

export interface TitleRecord {
	date: string;
	state: string;
	titleNumber?: string;
	transferType: 'sale' | 'inheritance' | 'gift' | 'other';
}

/**
 * Inspection history data structures
 */
export interface InspectionHistory {
	emissions: InspectionRecord[];
	safety: InspectionRecord[];
}

export interface InspectionRecord {
	date: string;
	location: string;
	result: 'pass' | 'fail';
	notes?: string;
}

/**
 * Insurance history data structures
 */
export interface InsuranceHistory {
	records: InsuranceRecord[];
}

export interface InsuranceRecord {
	claimDate: string;
	claimType: 'collision' | 'comprehensive' | 'liability' | 'other';
	amount?: number;
	status: 'open' | 'closed' | 'denied';
}

/**
 * Junk and salvage information data structures
 */
export interface JunkSalvageInfo {
	isSalvage: boolean;
	isJunk: boolean;
	records: JunkSalvageRecord[];
}

export interface JunkSalvageRecord {
	date: string;
	type: 'salvage' | 'junk' | 'total-loss';
	reason?: string;
	auctionHouse?: string;
}

/**
 * Accident and damage history data structures
 */
export interface AccidentHistory {
	accidents: AccidentRecord[];
	totalAccidents: number;
}

export interface AccidentRecord {
	date: string;
	severity: 'minor' | 'moderate' | 'severe';
	damageAreas: DamageArea[];
	airbagDeployment: boolean;
	estimatedCost?: number;
	location?: string;
}

export interface DamageArea {
	area: 'front' | 'rear' | 'left-side' | 'right-side' | 'roof' | 'undercarriage';
	severity: 'minor' | 'moderate' | 'severe';
}

/**
 * Lien and impound history data structures
 */
export interface LienImpoundHistory {
	liens: LienRecord[];
	impounds: ImpoundRecord[];
}

export interface LienRecord {
	date: string;
	holder: string;
	amount?: number;
	status: 'active' | 'released';
}

export interface ImpoundRecord {
	date: string;
	location: string;
	reason: string;
	releaseDate?: string;
}

/**
 * Theft history data structures
 */
export interface TheftHistory {
	records: TheftRecord[];
	isStolen: boolean;
}

export interface TheftRecord {
	reportDate: string;
	recoveryDate?: string;
	location: string;
	status: 'stolen' | 'recovered';
}

/**
 * Title brands data structures
 */
export interface TitleBrands {
	brands: TitleBrand[];
}

export interface TitleBrand {
	brand: 'salvage' | 'rebuilt' | 'flood' | 'hail' | 'lemon' | 'other';
	date: string;
	state: string;
	description?: string;
}

/**
 * Market value data structure
 */
export interface MarketValue {
	currentValue?: number;
	currency: string;
	source: string;
	date: string;
	condition?: 'excellent' | 'good' | 'fair' | 'poor';
	mileageAdjustment?: number;
}

/**
 * Warranty information data structures
 */
export interface WarrantyInfo {
	manufacturer?: WarrantyRecord;
	extended?: WarrantyRecord[];
}

export interface WarrantyRecord {
	type: string;
	startDate: string;
	endDate: string;
	mileageLimit?: number;
	provider: string;
	status: 'active' | 'expired';
}
