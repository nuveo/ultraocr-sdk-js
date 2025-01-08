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

// ultraocr/constants.ts
var constants_exports = {};
__export(constants_exports, {
  API_TIMEOUT: () => API_TIMEOUT,
  AUTH_BASE_URL: () => AUTH_BASE_URL,
  BASE_URL: () => BASE_URL,
  DEFAULT_EXPIRATION_TIME: () => DEFAULT_EXPIRATION_TIME,
  METHOD_GET: () => METHOD_GET,
  METHOD_POST: () => METHOD_POST,
  METHOD_PUT: () => METHOD_PUT,
  POOLING_INTERVAL: () => POOLING_INTERVAL,
  STATUS_DONE: () => STATUS_DONE,
  STATUS_ERROR: () => STATUS_ERROR
});
module.exports = __toCommonJS(constants_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  API_TIMEOUT,
  AUTH_BASE_URL,
  BASE_URL,
  DEFAULT_EXPIRATION_TIME,
  METHOD_GET,
  METHOD_POST,
  METHOD_PUT,
  POOLING_INTERVAL,
  STATUS_DONE,
  STATUS_ERROR
});
