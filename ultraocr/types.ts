export type Resource = 'job' | 'batch';

export type Config = {
  clientID?: string;
  clientSecret?: string;
  expires?: number;
  autoRefresh?: boolean;
  authBaseUrl?: string;
  baseUrl?: string;
  timeout?: number;
  interval?: number;
};

export type TokenResponse = {
  token: string;
};

export type UploadLinkResponse = {
  exp: string;
  id: string;
  status_url: string;
  urls: Record<string, string>;
};

export type CreatedResponse = {
  id: string;
  status_url: string;
};

export type Result = {
  Document: unknown;
  Quantity: number;
  Time: string;
};

export type JobResultResponse = {
  result?: Result;
  job_ksuid: string;
  created_at: string;
  service: string;
  status: string;
  error?: string;
  process_time?: string;
  filename?: string;
  validation_status?: string;
  client_data: unknown;
  validation: unknown;
};

export type JobInfoResponse = {
  result?: Result;
  job_id: string;
  client_id: string;
  company_id: string;
  source: string;
  created_at: string;
  finished_at?: string;
  service: string;
  status: string;
  error?: string;
  validation_status?: string;
  validation_id?: string;
  client_data?: unknown;
  metadata?: unknown;
  validation?: unknown;
};

export type BatchInfoResponse = {
  batch_id: string;
  client_id: string;
  company_id: string;
  source: string;
  created_at: string;
  service: string;
  status: string;
  error?: string;
  filename?: string;
  validation_id?: string;
  total_jobs?: number;
  total_processed?: number;
};

export type BatchResultJob = {
  result?: Result;
  job_ksuid: string;
  created_at: string;
  service: string;
  status: string;
  error?: string;
  filename?: string;
  validation_status?: string;
  client_data?: unknown;
  validation?: unknown;
};

export type BatchResultStorageResponse = {
  exp: string;
  url: string;
};

export type BatchStatusJobs = {
  job_ksuid: string;
  created_at: string;
  status: string;
  result_url: string;
  error?: string;
};

export type BatchStatusResponse = {
  batch_ksuid: string;
  created_at: string;
  status: string;
  service: string;
  error?: string;
  jobs: BatchStatusJobs[];
};

export type GetJobsResponse = {
  jobs: JobResultResponse[];
  nextPageToken: string;
};

export type SingleStepInput = {
  metadata: Record<string, unknown>;
  data: string;
  facematch?: string;
  extra?: string;
};
