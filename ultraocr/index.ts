import {
  POOLING_INTERVAL,
  API_TIMEOUT,
  BASE_URL,
  AUTH_BASE_URL,
  DEFAULT_EXPIRATION_TIME,
  STATUS_DONE,
  STATUS_ERROR,
} from './constants';
import {
  Resource,
  Config,
  UploadLinkResponse,
  JobResultResponse,
  BatchStatusResponse,
} from './types';
import { readFileSync } from 'fs';

export class Client {
  clientID: string;
  clientSecret: string;
  expires: number;
  autoRefresh: boolean;
  authBaseUrl: string;
  baseUrl: string;
  timeout: number;
  interval: number;
  token: string;
  expiresAt: Date;

  constructor(config: Config) {
    this.clientID = config.clientID || '';
    this.clientSecret = config.clientSecret || '';
    this.expires = config.expires || DEFAULT_EXPIRATION_TIME;
    this.autoRefresh = config.autoRefresh || false;
    this.authBaseUrl = config.authBaseUrl || AUTH_BASE_URL;
    this.baseUrl = config.baseUrl || BASE_URL;
    this.timeout = config.timeout || API_TIMEOUT;
    this.interval = config.interval || POOLING_INTERVAL;
    this.token = '';
    this.expiresAt = new Date();
  }

  private async request(
    endpoint: string,
    method: string,
    body: string,
    params: Record<string, string> = {},
  ) {
    await this.autoAuthenticate();

    const urlParams = new URLSearchParams(params).toString();
    const url = `${endpoint}?${urlParams}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
    const input = {
      method,
      headers,
      body: JSON.stringify(body),
    };

    const response = await fetch(url, input);
    return response;
  }

  private async post(
    endpoint: string,
    body: Record<string, any> = {},
    params: Record<string, string> = {},
  ) {
    return await this.request(endpoint, 'POST', JSON.stringify(body), params);
  }

  private async get(endpoint: string, params: Record<string, string> = {}) {
    return await this.request(endpoint, 'POST', '', params);
  }

  private async autoAuthenticate() {
    if (this.autoRefresh && new Date() > this.expiresAt)
      await this.authenticate(this.clientID, this.clientSecret, this.expires);
  }

  public async authenticate(
    clientID: string,
    clientSecret: string,
    expires: number = DEFAULT_EXPIRATION_TIME,
  ) {
    const url = `${this.authBaseUrl}/token`;

    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      ClientID: clientID,
      ClientSecret: clientSecret,
      ExpiresIn: expires,
    };

    const input = {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };

    const response = await fetch(url, input);
    if (response.ok) {
      const res = await response.json();
      this.token = res.token;
      const now = new Date();
      this.expiresAt = new Date(now.getTime() + expires * 60 * 1000);
    }
  }

  public async generateSignedUrl(
    service: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    resource: Resource = 'job',
  ): Promise<UploadLinkResponse> {
    const url = `${this.baseUrl}/ocr/${resource}/${service}`;
    const resp = await this.post(url, metadata, params);
    if (resp.ok) {
      const res = await resp.json();
      return res;
    }
  }

  public async uploadFile(url: string, body: string) {
    const input = {
      method: 'PUT',
      body,
    };

    const response = await fetch(url, input);
    return response;
  }

  public async uploadFileWithPath(url: string, filePath: string) {
    const file = readFileSync(filePath, 'utf-8');
    return this.uploadFile(url, file);
  }

  public async sendJobSingleStep(
    service: string,
    file: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematch_file: string = '',
    extra_file: string = '',
  ) {
    const url = `${this.baseUrl}/ocr/job/send/${service}`;
    const body = {
      metadata: metadata,
      data: file,
    } as any;
    if (params && params.facematch == 'true') body.facematch = facematch_file;
    if (params && params.extra_file == 'true') body.extra = extra_file;

    const resp = await this.post(url, body, (params = params));
    if (resp.ok) {
      const res = await resp.json();
      return res;
    }
  }

  public async sendJob(
    service: string,
    filePath: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematchFilePath: string = '',
    extraFilePath: string = '',
  ) {
    const res = await this.generateSignedUrl(service, metadata, params, 'job');
    const urls = res.urls || {};

    const url = urls.document;
    this.uploadFileWithPath(url, filePath);

    if (params && params.facematch == 'true') {
      const facematch_url = urls.selfie;
      this.uploadFileWithPath(facematch_url, facematchFilePath);
    }

    if (params && params['extra-document'] == 'true') {
      const extra_url = urls.extra_document;
      this.uploadFileWithPath(extra_url, extraFilePath);
    }

    return {
      id: res.id,
      status_url: res.status_url,
    };
  }

  public async sendBatch(
    service: string,
    filePath: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
  ) {
    const res = await this.generateSignedUrl(service, metadata, params, 'batch');
    const urls = res.urls || {};

    const url = urls.document;
    this.uploadFileWithPath(url, filePath);

    return {
      id: res.id,
      status_url: res.status_url,
    };
  }

  public async sendJobBase64(
    service: string,
    file: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematchFile: string = '',
    extraFile: string = '',
  ) {
    params.base64 = 'true';
    const res = await this.generateSignedUrl(service, metadata, params, 'job');
    const urls = res.urls || {};

    const url = urls.document;
    this.uploadFile(url, file);

    if (params && params.facematch == 'true') {
      const facematch_url = urls.selfie;
      this.uploadFile(facematch_url, facematchFile);
    }

    if (params && params['extra-document'] == 'true') {
      const extra_url = urls.extra_document;
      this.uploadFile(extra_url, extraFile);
    }

    return {
      id: res.id,
      status_url: res.status_url,
    };
  }

  public async sendBatchBase64(
    service: string,
    file: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
  ) {
    params.base64 = 'true';
    const res = await this.generateSignedUrl(service, metadata, params, 'batch');
    const urls = res.urls || {};

    const url = urls.document;
    this.uploadFile(url, file);

    return {
      id: res.id,
      status_url: res.status_url,
    };
  }

  public async getBatchStatus(batchID: string): Promise<BatchStatusResponse> {
    const url = `${this.baseUrl}/ocr/batch/status/${batchID}`;
    const resp = await this.get(url);
    if (resp.ok) {
      const res = await resp.json();
      return res;
    }
  }

  public async getJobResult(batchID: string, jobID: string): Promise<JobResultResponse> {
    const url = `${this.baseUrl}/ocr/job/result/${batchID}/${jobID}`;
    const resp = await this.get(url);
    if (resp.ok) {
      const res = await resp.json();
      return res;
    }
  }

  public async waitForJobDone(batchID: string, jobID: string) {
    // TODO use setInterval and change error type
    const now = new Date();
    const limit = new Date(now.getTime() + this.timeout * 1000);

    while (new Date() < limit) {
      const res = await this.getJobResult(batchID, jobID);

      if ([STATUS_DONE, STATUS_ERROR].includes(res.status)) {
        return res;
      }

      setTimeout(() => {}, this.interval * 1000);
    }

    throw Error('Timeout');
  }

  public async waitForBatchDone(batchID: string, waitJobs: boolean = true) {
    // TODO use setInterval and change error type
    const now = new Date();
    const limit = new Date(now.getTime() + this.timeout * 1000);
    let res: BatchStatusResponse;

    while (new Date() < limit) {
      res = await this.getBatchStatus(batchID);

      if ([STATUS_DONE, STATUS_ERROR].includes(res.status)) {
        break;
      }

      setTimeout(() => {}, this.interval * 1000);
    }

    if (new Date() > limit) {
      throw Error('Timeout');
    }

    if (waitJobs) {
      res.jobs.forEach(async (job) => {
        await this.waitForJobDone(batchID, job.job_ksuid);
      });
    }

    return res;
  }
}
