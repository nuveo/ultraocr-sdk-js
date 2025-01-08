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

// ultraocr/helpers.ts
var helpers_exports = {};
__export(helpers_exports, {
  uploadFile: () => uploadFile,
  uploadFileWithPath: () => uploadFileWithPath,
  validateResponse: () => validateResponse
});
module.exports = __toCommonJS(helpers_exports);

// ultraocr/errors.ts
var InvalidStatusCodeError = class _InvalidStatusCodeError extends Error {
  constructor(status) {
    const msg = `Invalid status code. Got ${status}, expected 2XX`;
    super(msg);
    Object.setPrototypeOf(this, _InvalidStatusCodeError.prototype);
  }
};

// ultraocr/helpers.ts
var import_fs = require("fs");

// ultraocr/constants.ts
var METHOD_PUT = "PUT";

// ultraocr/helpers.ts
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  uploadFile,
  uploadFileWithPath,
  validateResponse
});
