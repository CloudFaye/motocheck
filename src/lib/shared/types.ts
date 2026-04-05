// Shared types used by both web app and worker process

export interface VehicleIdentity {
	year: number;
	make: string;
	model: string;
	trim?: string;
	bodyStyle?: string;
	engineDescription?: string;
	driveType?: string;
	fuelType?: string;
}

export type EventType =
	| 'title_transfer'
	| 'auction_sale'
	| 'accident'
	| 'recall'
	| 'inspection'
	| 'listing'
	| 'theft'
	| 'title_brand';

export interface VehicleEvent {
	type: EventType;
	date: string; // ISO 8601
	description: string;
	location?: string;
	details: Record<string, any>;
}

export type OdometerSource =
	| 'title_transfer'
	| 'state_inspection'
	| 'auction'
	| 'service_record'
	| 'listing';

export interface OdometerReading {
	date: string; // ISO 8601
	mileage: number;
	source: OdometerSource;
	reportedBy?: string;
	isAnomaly?: boolean;
	anomalyNote?: string;
}

export type TitleBrand = 'salvage' | 'rebuilt' | 'flood' | 'hail' | 'lemon' | 'other';

export interface TitleBrandRecord {
	brand: TitleBrand;
	date: string;
	state: string;
	description?: string;
}

export interface RecallRecord {
	component: string;
	summary: string;
	consequence: string;
	remedy: string;
	reportReceivedDate: string;
	nhtsaCampaignNumber: string;
}

export interface MarketValue {
	askingPrice?: number;
	priceRating?: string;
	marketAverage?: number;
	daysOnMarket?: number;
	currency: string;
}

export interface DamageRecord {
	date: string;
	primaryDamage: string;
	secondaryDamage?: string;
	titleCode?: string;
	location: string;
}

export interface NormalizedVehicleRecord {
	vin: string;
	source: string;

	// Vehicle identity (optional, only from NHTSA)
	identity?: VehicleIdentity;

	// Events (chronological occurrences)
	events: VehicleEvent[];

	// Odometer readings
	odometerReadings: OdometerReading[];

	// Title brands
	titleBrands: TitleBrandRecord[];

	// Recalls (only from NHTSA)
	recalls?: RecallRecord[];

	// Market value (only from AutoTrader/CarGurus)
	marketValue?: MarketValue;

	// Damage records (only from Copart/IAAI)
	damageRecords?: DamageRecord[];
}

export interface TitleTransfer {
	date: string;
	state: string;
	titleNumber?: string;
	transferType: 'sale' | 'inheritance' | 'gift' | 'other';
}

export interface HistoryGap {
	startDate: string;
	endDate: string;
	durationMonths: number;
	severity: 'medium' | 'high';
}

export interface Timeline {
	identity: VehicleIdentity;
	titleHistory: TitleTransfer[];
	titleBrands: TitleBrandRecord[];
	recalls: RecallRecord[];
	damageRecords: DamageRecord[];
	odometerReadings: OdometerReading[];
	marketValue: MarketValue;
	events: VehicleEvent[];
	gaps: HistoryGap[];
	sourcesCovered: string[];
}

export type ReportStatus =
	| 'pending'
	| 'fetching'
	| 'normalizing'
	| 'stitching'
	| 'analyzing'
	| 'ready'
	| 'failed';

export type DataSource =
	| 'nhtsa_decode'
	| 'nhtsa_recalls'
	| 'nmvtis'
	| 'nicb'
	| 'copart'
	| 'iaai'
	| 'autotrader'
	| 'cargurus';
