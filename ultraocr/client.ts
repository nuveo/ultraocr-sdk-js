import { clearInterval } from 'timers';
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
  TokenResponse,
  CreatedResponse,
  GetJobsResponse,
} from './types';
import { TimeoutError, InvalidStatusCodeError } from './errors';
import { validateResponse, uploadFile, uploadFileWithPath } from './helpers';
import { METHOD_GET, METHOD_POST } from './constants';

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
    this.clientID = config?.clientID || '';
    this.clientSecret = config?.clientSecret || '';
    this.expires = config?.expires || DEFAULT_EXPIRATION_TIME;
    this.autoRefresh = config?.autoRefresh || false;
    this.authBaseUrl = config?.authBaseUrl || AUTH_BASE_URL;
    this.baseUrl = config?.baseUrl || BASE_URL;
    this.timeout = config?.timeout || API_TIMEOUT;
    this.interval = config?.interval || POOLING_INTERVAL;
    this.token = '';
    this.expiresAt = new Date();
  }

  private async request(
    endpoint: string,
    method: string,
    body: string,
    params: Record<string, string> = {},
  ): Promise<any> {
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
  ): Promise<any> {
    return await this.request(endpoint, METHOD_POST, JSON.stringify(body), params);
  }

  private async get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    return await this.request(endpoint, METHOD_GET, '', params);
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
      method: METHOD_POST,
      headers,
      body: JSON.stringify(data),
    };

    const response = await fetch(url, input);
    validateResponse(response);

    const res: TokenResponse = await response.json();
    this.token = res.token;

    const now = new Date();
    this.expiresAt = new Date(now.getTime() + expires * 60 * 1000);
  }

  public async generateSignedUrl(
    service: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    resource: Resource = 'job',
  ): Promise<UploadLinkResponse> {
    const url = `${this.baseUrl}/ocr/${resource}/${service}`;
    const response = await this.post(url, metadata, params);
    validateResponse(response);

    const res: UploadLinkResponse = await response.json();
    return res;
  }

  public async sendJobSingleStep(
    service: string,
    file: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematchFile: string = '',
    extraFile: string = '',
  ): Promise<CreatedResponse> {
    const url = `${this.baseUrl}/ocr/job/send/${service}`;
    const body = {
      metadata: metadata,
      data: file,
    } as any;
    if (params && params.facematch == 'true') body.facematch = facematchFile;
    if (params && params.extraFile == 'true') body.extra = extraFile;

    const response = await this.post(url, body, (params = params));
    validateResponse(response);

    const res: CreatedResponse = await response.json();
    return res;
  }

  public async sendJob(
    service: string,
    filePath: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematchFilePath: string = '',
    extraFilePath: string = '',
  ): Promise<CreatedResponse> {
    const res = await this.generateSignedUrl(service, metadata, params, 'job');
    const urls = res.urls || {};

    const url = urls.document;
    uploadFileWithPath(url, filePath);

    if (params && params.facematch == 'true') {
      const facematchUrl = urls.selfie;
      uploadFileWithPath(facematchUrl, facematchFilePath);
    }

    if (params && params['extra-document'] == 'true') {
      const extraUrl = urls.extra_document;
      uploadFileWithPath(extraUrl, extraFilePath);
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
  ): Promise<CreatedResponse> {
    const res = await this.generateSignedUrl(service, metadata, params, 'batch');
    const urls = res.urls || {};

    const url = urls.document;
    uploadFileWithPath(url, filePath);

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
  ): Promise<CreatedResponse> {
    params.base64 = 'true';
    const res = await this.generateSignedUrl(service, metadata, params, 'job');
    const urls = res.urls || {};

    const url = urls.document;
    uploadFile(url, file);

    if (params && params.facematch == 'true') {
      const facematchUrl = urls.selfie;
      uploadFile(facematchUrl, facematchFile);
    }

    if (params && params['extra-document'] == 'true') {
      const extraUrl = urls.extra_document;
      uploadFile(extraUrl, extraFile);
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
  ): Promise<CreatedResponse> {
    params.base64 = 'true';
    const res = await this.generateSignedUrl(service, metadata, params, 'batch');
    const urls = res.urls || {};

    const url = urls.document;
    uploadFile(url, file);

    return {
      id: res.id,
      status_url: res.status_url,
    };
  }

  public async getBatchStatus(batchID: string): Promise<BatchStatusResponse> {
    const url = `${this.baseUrl}/ocr/batch/status/${batchID}`;
    const response = await this.get(url);
    validateResponse(response);

    const res: BatchStatusResponse = await response.json();
    return res;
  }

  public async getJobResult(batchID: string, jobID: string): Promise<JobResultResponse> {
    const url = `${this.baseUrl}/ocr/job/result/${batchID}/${jobID}`;
    const response = await this.get(url);
    validateResponse(response);

    const res: JobResultResponse = await response.json();
    return res;
  }

  /**
   * Get all created jobs in a time interval.
   * @param {string} start - The start time (in the format YYYY-MM-DD).
   * @param {string} end - The end time (in the format YYYY-MM-DD).
   * @returns {Promise<JobResultResponse[]>} A promise with the jobs result list.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const jobs = await client.getJobs("2024-01-01", "2024-01-02");
   * console.log(jobs);
   * // Output: [
   * //         {
   * //           created_at: "2021-01-01T00:00:00Z",
   * //           job_ksuid: "21eRubs77luzFr1GdJfHdddH6EA",
   * //           result: {},
   * //           service: "chn",
   * //           status: "done"
   * //         }
   * //       ]
   */
  public async getJobs(start: string, end: string): Promise<JobResultResponse[]> {
    const params = {
      startDate: start,
      endtDate: end,
    } as Record<string, string>;
    const url = `${this.baseUrl}/ocr/job/results`;

    let jobs = [] as JobResultResponse[];
    let hasNextPage = true;
    while (hasNextPage) {
      const response = await this.get(url, params);
      validateResponse(response);

      const res: GetJobsResponse = await response.json();
      jobs = jobs.concat(res.jobs);

      const token = res.nextPageToken;
      params.nextPageToken = token;
      if (!token) hasNextPage = false;
    }

    return jobs;
  }

  public async waitForJobDone(batchID: string, jobID: string): Promise<JobResultResponse> {
    const now = new Date();
    const limit = new Date(now.getTime() + this.timeout * 1000);

    const prom = new Promise<JobResultResponse>((resolve, reject) => {
      const interval = setInterval(async () => {
        const res = await this.getJobResult(batchID, jobID);

        if ([STATUS_DONE, STATUS_ERROR].includes(res.status)) {
          clearInterval(interval);
          resolve(res);
        }

        if (new Date() > limit) {
          clearInterval(interval);
          reject(new TimeoutError(this.timeout, res));
        }
      }, this.interval * 1000);
    });

    const res = await prom;
    return res;
  }

  public async waitForBatchDone(
    batchID: string,
    waitJobs: boolean = true,
  ): Promise<BatchStatusResponse> {
    const now = new Date();
    const limit = new Date(now.getTime() + this.timeout * 1000);

    const interval = new Promise<BatchStatusResponse>((resolve, reject) => {
      const i = setInterval(async () => {
        const res = await this.getBatchStatus(batchID);

        if ([STATUS_DONE, STATUS_ERROR].includes(res.status)) {
          clearInterval(i);
          resolve(res);
        }

        if (new Date() > limit) {
          clearInterval(i);
          reject(new TimeoutError(this.timeout, res));
        }
      }, this.interval * 1000);
    });

    const res = await interval;

    if (waitJobs) {
      res.jobs.forEach(async (job) => {
        await this.waitForJobDone(batchID, job.job_ksuid);
      });
    }

    return res;
  }

  public async createAndWaitJob(
    service: string,
    filePath: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    facematchFilePath: string = '',
    extraFilePath: string = '',
  ): Promise<JobResultResponse> {
    const res = await this.sendJob(
      service,
      filePath,
      metadata,
      params,
      facematchFilePath,
      extraFilePath,
    );
    const jobID = res.id;
    return this.waitForJobDone(jobID, jobID);
  }

  public async createAndWaitBatch(
    service: string,
    filePath: string,
    metadata: Record<string, any> = {},
    params: Record<string, string> = {},
    waitJobs: boolean = true,
  ): Promise<BatchStatusResponse> {
    const res = await this.sendBatch(service, filePath, metadata, params);
    return this.waitForBatchDone(res.id, waitJobs);
  }
}
