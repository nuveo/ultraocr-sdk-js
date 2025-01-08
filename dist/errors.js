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

// ultraocr/errors.ts
var errors_exports = {};
__export(errors_exports, {
  InvalidStatusCodeError: () => InvalidStatusCodeError,
  TimeoutError: () => TimeoutError
});
module.exports = __toCommonJS(errors_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InvalidStatusCodeError,
  TimeoutError
});
