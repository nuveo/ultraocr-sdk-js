# UltraOCR SDK JS

UltraOCR SDK for Javascript and Typescript.

[UltraOCR](https://ultraocr.com.br/) is a platform that assists in the document analysis process with AI.

For more details about the system, types of documents, routes and params, access our [documentation](https://docs.nuveo.ai/ocr/v2/).

## Instalation

First of all, you must install this package with npm:

```
npm install git://github.com/nuveo/ultraocr-sdk-js.git
```

Then you must import the UltraOCR SDK in your code with:

```javascript
import { Client } from 'ultraocr-sdk';
```

## Step by step

### First step - Client Creation and Authentication

With the UltraOCR SDK installed and imported, the first step is create the Client and authenticate, you have two ways to do it.

The first one, you can do it in two steps with:

```javascript
import { Client } from 'ultraocr-sdk';

const client = new Client();
await client.authenticate('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET');
```

Optionally, you can pass a third argument `expires` on `authenticate` function, a number between `1` and `1440`, the Token time expiration in minutes. The default value is 60.

Another way is creating the client with the Client info and `autoRefresh` as `true`. As example:

```javascript
import { Client } from 'ultraocr-sdk';

const client = new Client({
  clientID: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  autoRefresh: true,
});
```

The Client have following allowed parameters:

- `clientID`: The Client ID to generate token (only if `autoRefresh=true`).
- `clientSecret`: The Client Secret to generate token (only if `autoRefresh=true`).
- `expires`: The token expiration time (only if `autoRefresh=true`) (Default 60).
- `autoRefresh`: Indicates that the token will be auto generated (with `clientID`, `clientSecret` and `expires` parameters) (Default false).
- `authBaseUrl`: The base url to authenticate (Default UltraOCR url).
- `baseUrl`: The base url to send documents (Default UltraOCR url).
- `timeout`: The pooling timeout in seconds (Default 30).
- `interval`: The pooling interval in seconds (Default 1).

### Second step - Send Documents

With everything set up, you can send documents:

```javascript
client.sendJob('SERVICE', 'FILE_PATH'); // Simple job
client.sendBatch('SERVICE', 'FILE_PATH'); // Simple batch
client.sendJobBase64('SERVICE', 'BASE64_DATA'); // Job in base64
client.sendBatchBase64('SERVICE', 'BASE64_DATA'); // Batch in base64
client.sendJobSingleStep('SERVICE', 'BASE64_DATA'); // Job in base64, faster, but with limits
```

Send batch response example:

```json
{
  "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
  "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/batch/status/0ujsszwN8NRY24YaXiTIE2VWDTS"
}
```

Send job response example:

```json
{
  "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
  "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/0ujsszwN8NRY24YaXiTIE2VWDTS"
}
```

In every above utilities you can send metadata and query params with `metadata` and `params` respectively dict parameters.

For jobs, to send facematch file (if you requested on query params or using facematch service), you must provide, after `metadata` and `params`, `facematchFile` on `sendJobBase64` and `sendJobSingleStep` or `facematchFilePath` on `sendJob`. To send extra file (if you requested on query params) with document back side, you must provide `extraFile` on `sendJobBase64` and `sendJobSingleStep` or `extraFilePath` on `sendJob` after facematch infos.

Examples using CNH service and sending facematch and extra files:

```javascript
const params = {
  'extra-document': 'true',
  facematch: 'true',
};

await client.sendJob('cnh', 'FILE_PATH', {}, params, 'FACEMATCH_FILE_PATH', 'EXTRA_FILE_PATH');
await client.sendJobBase64(
  'SERVICE',
  'BASE64_DATA',
  {},
  params,
  'FACEMATCH_BASE64_DATA',
  'EXTRA_BASE64_DATA',
);
await client.sendJobSingleStep(
  'SERVICE',
  'BASE64_DATA',
  {},
  params,
  'FACEMATCH_BASE64_DATA',
  'EXTRA_BASE64_DATA',
);
```

Alternatively, you can request the signed url directly, without any utility, but you will must to upload the document manually. Example:

```javascript
const res = await client.generateSignedUrl('SERVICE'); // Request job
const urls = urls.document;
const url = urls.document;
const file = readFileSync(filePath, UTF8);

await fetch(url, {
  method: 'PUT',
  body: file,
});

const res = client.generateSignedUrl('SERVICE', {}, [], 'batch'); // Request batch
const urls = urls.document;
const url = urls.document;
const file = readFileSync(filePath, UTF8);

await fetch(url, {
  method: 'PUT',
  body: file,
});
```

Example of response from `generateSignedUrl` with facematch and extra files:

```json
{
  "exp": "60000",
  "id": "0ujsszwN8NRY24YaXiTIE2VWDTS",
  "status_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/batch/status/0ujsszwN8NRY24YaXiTIE2VWDTS",
  "urls": {
    "document": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host",
    "selfie": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host",
    "extra_document": "https://presignedurldemo.s3.eu-west-2.amazonaws.com/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJWZ7B6WCRGMKFGQ%2F20180210%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20180210T171315Z&X-Amz-Expires=1800&X-Amz-Signature=12b74b0788aa036bc7c3d03b3f20c61f1f91cc9ad8873e3314255dc479a25351&X-Amz-SignedHeaders=host"
  }
}
```

### Third step - Get Result

With the job or batch id, you can get the job result or batch status with:

```javascript
const res = await client.getBatchStatus('BATCH_ID'); // Batches
const res = await client.getJobResult('JOB_ID', 'JOB_ID'); // Simple jobs
const res = await client.getJobResult('BATCH_ID', 'JOB_ID'); // Jobs belonging to batches
```

Alternatively, you can use a utily `waitForJobDone` or `waitForBatchDone`:

```javascript
const res = await client.waitForBatchDone('BATCH_ID'); // Batches, ends when the batch and all it jobs are finished
const res = await client.waitForBatchDone('BATCH_ID', false); // Batches, ends when the batch is finished
const res = await client.waitForJobDone('JOB_ID', 'JOB_ID'); // Simple jobs
const res = await client.waitForJobDone('BATCH_ID', 'JOB_ID'); // Jobs belonging to batches
```

Batch status example:

```json
{
  "batch_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
  "created_at": "2022-06-22T20:58:09Z",
  "jobs": [
    {
      "created_at": "2022-06-22T20:58:09Z",
      "job_ksuid": "0ujsszwN8NRY24YaXiTIE2VWDTS",
      "result_url": "https://ultraocr.apis.nuveo.ai/v2/ocr/job/result/2AwrSd7bxEMbPrQ5jZHGDzQ4qL3/0ujsszwN8NRY24YaXiTIE2VWDTS",
      "status": "processing"
    }
  ],
  "service": "cnh",
  "status": "done"
}
```

Job result example:

```json
{
  "created_at": "2022-06-22T20:58:09Z",
  "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
  "result": {
    "Time": "7.45",
    "Document": [
      {
        "Page": 1,
        "Data": {
          "DocumentType": {
            "conf": 99,
            "value": "CNH"
          }
        }
      }
    ]
  },
  "service": "idtypification",
  "status": "done"
}
```

### Simplified way

You can do all steps in a simplified way, with `createAndWaitJob` or `createAndWaitBatch` utilities:

```javascript
import { Client } from 'ultraocr-sdk';

const client = new Client({
  clientID: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  autoRefresh: true,
});
const res = await client.createAndWaitJob('SERVICE', 'YOUR_FILE_PATH');
```

Or:

```javascript
import { Client } from 'ultraocr-sdk';

const client = new Client({
  clientID: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  autoRefresh: true,
});
client.createAndWaitBatch('SERVICE', 'YOUR_FILE_PATH');
```

The `createAndWaitJob` has the `sendJob` arguments and `getJobResult` response, while the `createAndWaitBatch` has the `sendBatch` arguments with the addition of `waitJobs` as last parameter and has the `getBatchStatus` response.

### Get many results

You can get all jobs in a given interval by calling `getJobs` utility:

```go
client.getJobs("START_DATE", "END_DATE") // Dates in YYYY-MM-DD format
```

Results:

```json
[
  {
    "created_at": "2022-06-22T20:58:09Z",
    "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL3",
    "result": {
      "Time": "7.45",
      "Document": [
        {
          "Page": 1,
          "Data": {
            "DocumentType": {
              "conf": 99,
              "value": "CNH"
            }
          }
        }
      ]
    },
    "service": "idtypification",
    "status": "done"
  },
  {
    "created_at": "2022-06-22T20:59:09Z",
    "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL4",
    "result": {
      "Time": "8.45",
      "Document": [
        {
          "Page": 1,
          "Data": {
            "DocumentType": {
              "conf": 99,
              "value": "CNH"
            }
          }
        }
      ]
    },
    "service": "cnh",
    "status": "done"
  },
  {
    "created_at": "2022-06-22T20:59:39Z",
    "job_ksuid": "2AwrSd7bxEMbPrQ5jZHGDzQ4qL5",
    "service": "cnh",
    "status": "processing"
  }
]
```
