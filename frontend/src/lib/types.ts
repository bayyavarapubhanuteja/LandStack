export type Role = "citizen" | "officer" | "admin";
export interface User { id: number; name: string; email: string; phone?: string | null; role: Role; department?: string | null; is_active: boolean; created_at: string }

export interface ParcelSummary {
  parcel_id: string; ulpin: string; survey_no: string; state: string; district: string; village: string;
  area_sqm: number; area_acres: number; land_use: string; verification_status: "verified" | "pending" | "flagged";
  ownership_status: string; registration_status: string; encumbrance_status: "clear" | "encumbered";
  building_permission: string; zone: string | null; tax_status: string; tax_due: number; centroid: [number, number]; updated_at: string;
}
export interface Feature { type: "Feature"; id: string; geometry: GeoJSON.Polygon; properties: ParcelSummary }
export interface FeatureCollection { type: "FeatureCollection"; features: Feature[] }

export interface OwnershipRec { owner_name: string; owner_type: string; share_pct: number; ror_number: string; khata_no: string; mutation_status: string; acquired_on: string; is_current: boolean }
export interface RegistrationRec { document_no: string; deed_type: string; sro_office: string; registered_on: string; market_value: number; stamp_duty: number; status: string }
export interface EncumbranceRec { type: string; holder: string; amount: number | null; start_date: string; end_date: string | null; status: string }
export interface ParcelDetail extends ParcelSummary {
  geometry: GeoJSON.Polygon;
  ownership: { status: string; masked: boolean; records: OwnershipRec[] };
  registration: { status: string; records: RegistrationRec[] };
  land_use_detail: { category: string; sub_category?: string; classification_source?: string; conversion_status?: string; classified_on?: string };
  planning: { available: boolean; zone?: string; master_plan?: string; fsi?: number; max_height_m?: number; setback_m?: number; building_permission_status?: string; permit_no?: string | null; permit_date?: string | null };
  encumbrance: { status: string; records: EncumbranceRec[] };
  services: { property_tax: { assessment_no: string; status: string; due_amount: number; last_paid: string | null }; utilities: { water: string; electricity: string } };
}

export type ServiceType = "ownership_verification" | "land_record_request" | "encumbrance_certificate" | "land_use_information" | "building_permission_status";
export type RequestStatus = "submitted" | "under_review" | "department_verification" | "completed" | "rejected";
export interface TimelineEntry { status: RequestStatus; label: string; at: string; by: string; note: string }
export interface ServiceRequest {
  request_id: string; parcel_id: string; service_type: ServiceType; purpose: string; status: RequestStatus; priority: string;
  department: string; timeline: TimelineEntry[]; officer_remarks: string | null; created_at: string; updated_at: string;
  applicant?: { name: string; email: string };
}
export interface AuditEntry { id: number; actor: string; action: string; entity_type: string; entity_id: string; details: string | null; created_at: string }
export interface Integration { code: string; name: string; dataset: string; record_count: number; coverage_pct: number; status: "connected" | "degraded" | "offline"; api_endpoint: string; last_sync: string; mock: boolean }
export interface NameValue { name: string; value: number }
export interface Summary {
  total_parcels: number; verified_parcels: number; pending_requests: number; completed_requests: number; active_services: number; my_requests: number; total_area_acres: number;
  land_use_distribution: NameValue[]; verification: NameValue[]; service_requests: NameValue[]; request_status: NameValue[]; department_coverage: NameValue[]; by_district: NameValue[];
}
export interface Filters { hierarchy: { state: string; district: string; village: string }[]; land_uses: string[]; verification: string[] }
export interface QueryAnswer { answer: string; parcel_id: string | null; sources: string[]; found: boolean }
