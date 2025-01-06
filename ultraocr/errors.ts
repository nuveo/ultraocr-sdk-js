export class TimeoutError extends Error {
  constructor(timeout: number) {
    const msg = `Timeout reached after ${timeout} seconds.`;
    super(msg);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class InvalidStatusCodeError extends Error {
  constructor(status: number) {
    const msg = `Invalid status code. Got ${status}, expected 2XX`;
    super(msg);
    Object.setPrototypeOf(this, InvalidStatusCodeError.prototype);
  }
}
