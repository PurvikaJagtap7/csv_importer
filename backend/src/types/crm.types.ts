export type CrmStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';

export type DataSource = 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots';

export interface CrmRecord {
  // All fields are optional. 
  // LOGIC: A record must have at least one of either 'email' or 'mobile_without_country_code' to be valid (not skipped).
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus;
  crm_note?: string;
  data_source?: DataSource;
  possession_time?: string;
  description?: string;
}

export interface ExtractResponse {
  imported: CrmRecord[];
  skipped: { row: any; reason: string }[];
  totalImported: number;
  totalSkipped: number;
}
