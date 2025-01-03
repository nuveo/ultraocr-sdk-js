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

// Client to help on UltraOCR usage. For more details about all arguments and returns,
// access the oficial system documentation on https://docs.nuveo.ai/ocr/v2/.
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

  /**
   * The client constructor.
   * @param {Config} config - The config specs.
   */
  constructor(config: Config = {}) {
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

  /**
   * Authenticate on UltraOCR and save the token to use on future requests.
   * @param {string} clientID - The Client ID generated on Web Interface.
   * @param {string} clientSecret - The Client Secret generated on Web Interface.
   * @param {number} expires - The token expires time in minutes (Default 60).
   * @returns {Promise<void>} A promise with success if authentication is ok.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * await client.authenticate("ID", "SECRET");
   */
  public async authenticate(
    clientID: string,
    clientSecret: string,
    expires: number = DEFAULT_EXPIRATION_TIME,
  ): Promise<void> {
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

  /**
   * Generate signed url to send the document to be processed by the AI.
   * @param {string} service - The the type of document to be sent.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {Resource} resource - The way to process, whether job or batch (Default job).
   * @returns {Promise<UploadLinkResponse>} A promise with the upload link response.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const signedUrl = await client.generateSignedUrl("SERVICE", {}, {}, "job");
   * console.log(signedUrl);
   * // Output: {
   * //           "exp": "60000",
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/batch/status/0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "urls": {
   * //             "document": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host",
   * //             "selfie": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host",
   * //             "extra_document": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host"
   * //           }
   * //         }
   */
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

  /**
   * Send job in a single step on UltraOCR, it's faster than usual method,
   * but have a 6MB as body limit (including metadata and base64 file).
   * @param {string} service - The the type of document to be sent.
   * @param {string} file - The file in base64 format.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {string} facematchFile - The facematch file in base64 format.
   * @param {string} extraFile - The extra file in base64 format.
   * @returns {Promise<CreatedResponse>} A promise with the job info to get it status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const jobCreated = await client.sendJobSingleStep("SERVICE", "FILE");
   * console.log(jobCreated);
   * // Output: {
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/0ujsszwN8NRY24YaXiTIE2VWDTS"
   * //         }
   */
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

  /**
   * Create and upload a job.
   * @param {string} service - The the type of document to be sent.
   * @param {string} filePath - The file path of the document.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {string} facematchFilePath - The facematch file path of the document.
   * @param {string} extraFilePath - The extra file path of the document.
   * @returns {Promise<CreatedResponse>} A promise with the job info to get it status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const jobCreated = await client.sendJob("SERVICE", "FILE_PATH");
   * console.log(jobCreated);
   * // Output: {
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/0ujsszwN8NRY24YaXiTIE2VWDTS"
   * //         }
   */
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

  /**
   * Create and upload a batch.
   * @param {string} service - The the type of document to be sent.
   * @param {string} filePath - The file path of the document.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @returns {Promise<CreatedResponse>} A promise with the batch info to get it status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const batchCreated = await client.sendBatch("SERVICE", "FILE_PATH");
   * console.log(batchCreated);
   * // Output: {
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/batch/status/0ujsszwN8NRY24YaXiTIE2VWDTS"
   * //         }
   */
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

  /**
   * Create and upload a job on base64 format (recommended only if you have
   * already converted the file to base64 format).
   * @param {string} service - The the type of document to be sent.
   * @param {string} file - The file in base64 format.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {string} facematchFile - The facematch file in base64 format.
   * @param {string} extraFile - The extra file in base64 format.
   * @returns {Promise<CreatedResponse>} A promise with the job info to get it status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const jobCreated = await client.sendJobBase64("SERVICE", "FILE");
   * console.log(jobCreated);
   * // Output: {
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/0ujsszwN8NRY24YaXiTIE2VWDTS"
   * //         }
   */
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

  /**
   * Create and upload a batch on base64 format (recommended only if you have
   * already converted the file to base64 format).
   * @param {string} service - The the type of document to be sent.
   * @param {string} file - The file in base64 format.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @returns {Promise<CreatedResponse>} A promise with the batch info to get it status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const batchCreated = await client.sendBatchBase64("SERVICE", "FILE");
   * console.log(batchCreated);
   * // Output: {
   * //           "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //           "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/batch/status/0ujsszwN8NRY24YaXiTIE2VWDTS"
   * //         }
   */
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

  /**
   * Get the status of the batch, checking whether it was processed or not.
   * @param {string} batchID - The id of the batch, given on batch creation.
   * @returns {Promise<BatchStatusResponse>} A promise with the batch status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const batch = await client.getBatchStatus("ID");
   * console.log(batch);
   * // Output: {
   * //           "batch_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "jobs": [
   * //             {
   * //               "created_at": "2022-06-22T20:58:09Z",
   * //               "job_ksuid": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "result_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/2AwrSd7bxEMbPrQ5jZHGDzQ4qL3/0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "status": "processing"
   * //             }
   * //           ],
   * //           "service": "cnh",
   * //           "status": "done"
   * //         }
   */
  public async getBatchStatus(batchID: string): Promise<BatchStatusResponse> {
    const url = `${this.baseUrl}/ocr/batch/status/${batchID}`;
    const response = await this.get(url);
    validateResponse(response);

    const res: BatchStatusResponse = await response.json();
    return res;
  }

  /**
   * Get the status and result of the job if it's already processed.
   * @param {string} batchID - The id of the batch, given on batch creation(repeat the job_id if batch wasn't created).
   * @param {string} jobID - The id of the job, given on job creation or on batch status.
   * @returns {Promise<JobResultResponse>} A promise with the job result.
   * @throws {InvalidStatusCodeError} If request fail.
   * @example
   * const job = await client.getJobResult("ID", "ID");
   * console.log(job);
   * // Output: {
   * //           "client_data": { },
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "result": {
   * //             "Time": "7.45",
   * //             "Document": [
   * //               {
   * //                 "Page": 1,
   * //                 "Data": {
   * //                   "DocumentType": {
   * //                     "conf": 99,
   * //                     "value": "CNH"
   * //                   }
   * //                 }
   * //               }
   * //             ]
   * //           },
   * //           "service": "idtypification",
   * //           "status": "done"
   * //         }
   */
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
   * //           {
   * //             created_at: "2021-01-01T00:00:00Z",
   * //             job_ksuid: "21eRubs77luzFr1GdJfHdddH6EA",
   * //             result: {},
   * //             service: "chn",
   * //             status: "done"
   * //           }
   * //         ]
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

  /**
   * Wait the job to be processed and returns the result.
   * @param {string} batchID - The id of the batch, given on batch creation(repeat the job_id if batch wasn't created).
   * @param {string} jobID - The id of the job, given on job creation or on batch status.
   * @returns {Promise<JobResultResponse>} A promise with the job result.
   * @throws {InvalidStatusCodeError} If request fail.
   * @throws {TimeoutError} If wait time exceed the limit.
   * @example
   * const job = await client.waitForJobDone("ID", "ID");
   * console.log(job);
   * // Output: {
   * //           "client_data": { },
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "result": {
   * //             "Time": "7.45",
   * //             "Document": [
   * //               {
   * //                 "Page": 1,
   * //                 "Data": {
   * //                   "DocumentType": {
   * //                     "conf": 99,
   * //                     "value": "CNH"
   * //                   }
   * //                 }
   * //               }
   * //             ]
   * //           },
   * //           "service": "idtypification",
   * //           "status": "done"
   * //         }
   */
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

  /**
   * Wait the batch to be processed and returns the status. The function will
   * wait the timeout given on Client creation.
   * @param {string} batchID - The id of the batch, given on batch creation.
   * @param {boolean} waitJobs - Indicate if must wait the jobs to be processed (default true).
   * @returns {Promise<BatchStatusResponse>} A promise with the batch status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @throws {TimeoutError} If wait time exceed the limit.
   * @example
   * const batch = await client.waitForBatchDone("ID");
   * console.log(batch);
   * // Output: {
   * //           "batch_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "jobs": [
   * //             {
   * //               "created_at": "2022-06-22T20:58:09Z",
   * //               "job_ksuid": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "result_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/2AwrSd7bxEMbPrQ5jZHGDzQ4qL3/0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "status": "processing"
   * //             }
   * //           ],
   * //           "service": "cnh",
   * //           "status": "done"
   * //         }
   */
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

  /**
   * Create the job and wait for job done.
   * @param {string} service - The the type of document to be sent.
   * @param {string} filePath - The file path of the document.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {string} facematchFilePath - The facematch file path of the document.
   * @param {string} extraFilePath - The extra file path of the document.
   * @returns {Promise<JobResultResponse>} A promise with the job result.
   * @throws {InvalidStatusCodeError} If request fail.
   * @throws {TimeoutError} If wait time exceed the limit.
   * @example
   * const job = await client.createAndWaitJob("SERVICE", "FILE_PATH");
   * console.log(job);
   * // Output: {
   * //           "client_data": { },
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "result": {
   * //             "Time": "7.45",
   * //             "Document": [
   * //               {
   * //                 "Page": 1,
   * //                 "Data": {
   * //                   "DocumentType": {
   * //                     "conf": 99,
   * //                     "value": "CNH"
   * //                   }
   * //                 }
   * //               }
   * //             ]
   * //           },
   * //           "service": "idtypification",
   * //           "status": "done"
   * //         }
   */
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

  /**
   * Create the batch and wait for batch done.
   * @param {string} service - The the type of document to be sent.
   * @param {string} filePath - The file path of the document.
   * @param {Record<string, any>} metadata - The metadata based on UltraOCR Docs format, optional in most cases.
   * @param {Record<string, string>} params - The query parameters based on UltraOCR Docs, optional in most cases.
   * @param {boolean} waitJobs - Indicate if must wait the jobs to be processed (default true).
   * @returns {Promise<BatchStatusResponse>} A promise with the batch status.
   * @throws {InvalidStatusCodeError} If request fail.
   * @throws {TimeoutError} If wait time exceed the limit.
   * @example
   * const batch = await client.createAndWaitBatch("SERVICE", "FILE_PATH");
   * console.log(batch);
   * // Output: {
   * //           "batch_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
   * //           "created_at": "2022-06-22T20:58:09Z",
   * //           "jobs": [
   * //             {
   * //               "created_at": "2022-06-22T20:58:09Z",
   * //               "job_ksuid": "0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "result_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/2AwrSd7bxEMbPrQ5jZHGDzQ4qL3/0ujsszwN8NRY24YaXiTIE2VWDTS",
   * //               "status": "processing"
   * //             }
   * //           ],
   * //           "service": "cnh",
   * //           "status": "done"
   * //         }
   */
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
