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
  Document: any;
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
  client_data: any;
  validation: any;
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
