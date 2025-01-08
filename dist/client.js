var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ultraocr/client.ts
var client_exports = {};
__export(client_exports, {
  Client: () => Client
});
module.exports = __toCommonJS(client_exports);

// ultraocr/constants.ts
var POOLING_INTERVAL = 1;
var API_TIMEOUT = 30;
var DEFAULT_EXPIRATION_TIME = 60;
var BASE_URL = "https://ultraocr.apis.nuveo.ai/v2";
var AUTH_BASE_URL = "https://auth.apis.nuveo.ai/v2";
var STATUS_DONE = "done";
var STATUS_ERROR = "error";
var METHOD_GET = "GET";
var METHOD_POST = "POST";
var METHOD_PUT = "PUT";

// ultraocr/errors.ts
var TimeoutError = class _TimeoutError extends Error {
  constructor(timeout) {
    const msg = `Timeout reached after ${timeout} seconds.`;
    super(msg);
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
var InvalidStatusCodeError = class _InvalidStatusCodeError extends Error {
  constructor(status) {
    const msg = `Invalid status code. Got ${status}, expected 2XX`;
    super(msg);
    Object.setPrototypeOf(this, _InvalidStatusCodeError.prototype);
  }
};

// ultraocr/helpers.ts
var import_fs = require("fs");
function validateResponse(response) {
  if (!response.ok) throw new InvalidStatusCodeError(response.status);
}
async function uploadFile(url, body) {
  const input = {
    method: METHOD_PUT,
    body
  };
  const response = await fetch(url, input);
  return response;
}
async function uploadFileWithPath(url, filePath) {
  const file = (0, import_fs.readFileSync)(filePath);
  return uploadFile(url, file);
}

// ultraocr/client.ts
var Client = class {
  clientID;
  clientSecret;
  expires;
  autoRefresh;
  authBaseUrl;
  baseUrl;
  timeout;
  interval;
  token;
  expiresAt;
  /**
   * The client constructor.
   * @param {Config} config - The config specs.
   */
  constructor(config = {}) {
    this.clientID = config?.clientID || "";
    this.clientSecret = config?.clientSecret || "";
    this.expires = config?.expires || DEFAULT_EXPIRATION_TIME;
    this.autoRefresh = config?.autoRefresh || false;
    this.authBaseUrl = config?.authBaseUrl || AUTH_BASE_URL;
    this.baseUrl = config?.baseUrl || BASE_URL;
    this.timeout = config?.timeout || API_TIMEOUT;
    this.interval = config?.interval || POOLING_INTERVAL;
    this.token = "";
    this.expiresAt = /* @__PURE__ */ new Date();
  }
  async request(endpoint, method, body, params = {}) {
    await this.autoAuthenticate();
    const urlParams = new URLSearchParams(params).toString();
    const url = `${endpoint}?${urlParams}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`
    };
    const input = {
      ...body && { body: JSON.stringify(body) },
      method,
      headers
    };
    const response = await fetch(url, input);
    return response;
  }
  async post(endpoint, body = null, params = {}) {
    return await this.request(endpoint, METHOD_POST, body, params);
  }
  async get(endpoint, params = {}) {
    return await this.request(endpoint, METHOD_GET, "", params);
  }
  async autoAuthenticate() {
    if (this.autoRefresh && /* @__PURE__ */ new Date() >= this.expiresAt)
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
  async authenticate(clientID, clientSecret, expires = DEFAULT_EXPIRATION_TIME) {
    const url = `${this.authBaseUrl}/token`;
    const headers = {
      "Content-Type": "application/json"
    };
    const data = {
      ClientID: clientID,
      ClientSecret: clientSecret,
      ExpiresIn: expires
    };
    const input = {
      method: METHOD_POST,
      headers,
      body: JSON.stringify(data)
    };
    const response = await fetch(url, input);
    validateResponse(response);
    const res = await response.json();
    this.token = res.token;
    const now = /* @__PURE__ */ new Date();
    this.expiresAt = new Date(now.getTime() + expires * 60 * 1e3);
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
  async generateSignedUrl(service, metadata = null, params = {}, resource = "job") {
    const url = `${this.baseUrl}/ocr/${resource}/${service}`;
    const response = await this.post(url, metadata, params);
    validateResponse(response);
    const res = await response.json();
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
  async sendJobSingleStep(service, file, metadata = {}, params = {}, facematchFile = "", extraFile = "") {
    const url = `${this.baseUrl}/ocr/job/send/${service}`;
    const body = {
      metadata,
      data: file
    };
    if (params && params.facematch == "true") body.facematch = facematchFile;
    if (params && params.extraFile == "true") body.extra = extraFile;
    const response = await this.post(url, body, params);
    validateResponse(response);
    const res = await response.json();
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
  async sendJob(service, filePath, metadata = {}, params = {}, facematchFilePath = "", extraFilePath = "") {
    const res = await this.generateSignedUrl(service, metadata, params, "job");
    const urls = res.urls || {};
    const url = urls.document;
    uploadFileWithPath(url, filePath);
    if (params && params.facematch == "true") {
      const facematchUrl = urls.selfie;
      uploadFileWithPath(facematchUrl, facematchFilePath);
    }
    if (params && params["extra-document"] == "true") {
      const extraUrl = urls.extra_document;
      uploadFileWithPath(extraUrl, extraFilePath);
    }
    return {
      id: res.id,
      status_url: res.status_url
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
  async sendBatch(service, filePath, metadata = [], params = {}) {
    const res = await this.generateSignedUrl(
      service,
      metadata.length ? metadata : null,
      params,
      "batch"
    );
    const urls = res.urls || {};
    const url = urls.document;
    uploadFileWithPath(url, filePath);
    return {
      id: res.id,
      status_url: res.status_url
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
  async sendJobBase64(service, file, metadata = {}, params = {}, facematchFile = "", extraFile = "") {
    params.base64 = "true";
    const res = await this.generateSignedUrl(service, metadata, params, "job");
    const urls = res.urls || {};
    const url = urls.document;
    uploadFile(url, file);
    if (params && params.facematch == "true") {
      const facematchUrl = urls.selfie;
      uploadFile(facematchUrl, facematchFile);
    }
    if (params && params["extra-document"] == "true") {
      const extraUrl = urls.extra_document;
      uploadFile(extraUrl, extraFile);
    }
    return {
      id: res.id,
      status_url: res.status_url
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
  async sendBatchBase64(service, file, metadata = [], params = {}) {
    params.base64 = "true";
    const res = await this.generateSignedUrl(service, metadata, params, "batch");
    const urls = res.urls || {};
    const url = urls.document;
    uploadFile(url, file);
    return {
      id: res.id,
      status_url: res.status_url
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
  async getBatchStatus(batchID) {
    const url = `${this.baseUrl}/ocr/batch/status/${batchID}`;
    const response = await this.get(url);
    validateResponse(response);
    const res = await response.json();
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
  async getJobResult(batchID, jobID) {
    const url = `${this.baseUrl}/ocr/job/result/${batchID}/${jobID}`;
    const response = await this.get(url);
    validateResponse(response);
    const res = await response.json();
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
  async getJobs(start, end) {
    const params = {
      startDate: start,
      endtDate: end
    };
    const url = `${this.baseUrl}/ocr/job/results`;
    let jobs = [];
    let hasNextPage = true;
    while (hasNextPage) {
      const response = await this.get(url, params);
      validateResponse(response);
      const res = await response.json();
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
  async waitForJobDone(batchID, jobID) {
    const now = /* @__PURE__ */ new Date();
    const limit = new Date(now.getTime() + this.timeout * 1e3);
    const prom = new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          if (/* @__PURE__ */ new Date() > limit) {
            clearInterval(interval);
            reject(new TimeoutError(this.timeout));
          }
          const res2 = await this.getJobResult(batchID, jobID);
          if ([STATUS_DONE, STATUS_ERROR].includes(res2.status)) {
            clearInterval(interval);
            resolve(res2);
          }
        } catch (e) {
          clearInterval(interval);
          reject(e);
        }
      }, this.interval * 1e3);
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
  async waitForBatchDone(batchID, waitJobs = false) {
    const now = /* @__PURE__ */ new Date();
    const limit = new Date(now.getTime() + this.timeout * 1e3);
    const prom = new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          if (/* @__PURE__ */ new Date() > limit) {
            clearInterval(interval);
            reject(new TimeoutError(this.timeout));
          }
          const res2 = await this.getBatchStatus(batchID);
          if ([STATUS_DONE, STATUS_ERROR].includes(res2.status)) {
            clearInterval(interval);
            resolve(res2);
          }
        } catch (e) {
          clearInterval(interval);
          reject(e);
        }
      }, this.interval * 1e3);
    });
    const res = await prom;
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
  async createAndWaitJob(service, filePath, metadata = {}, params = {}, facematchFilePath = "", extraFilePath = "") {
    const res = await this.sendJob(
      service,
      filePath,
      metadata,
      params,
      facematchFilePath,
      extraFilePath
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
  async createAndWaitBatch(service, filePath, metadata = [], params = {}, waitJobs = true) {
    const res = await this.sendBatch(service, filePath, metadata, params);
    return this.waitForBatchDone(res.id, waitJobs);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Client
});
