import { describe, expect, test } from '@jest/globals';
import { Client, InvalidStatusCodeError, METHOD_GET, METHOD_POST, TimeoutError } from '../ultraocr';

describe('constants', () => {
  test('get constants', () => {
    expect(METHOD_GET).toBe('GET');
  });
});

describe('client', () => {
  test('create client default', () => {
    const client = new Client();
    expect(client).toBeInstanceOf(Client);
    expect(client).toHaveProperty('expires', 60);
  });

  test('create client custom', () => {
    const client = new Client({ expires: 10 });
    expect(client).toBeInstanceOf(Client);
    expect(client).not.toEqual(new Client());
    expect(client).toHaveProperty('expires', 10);
  });
});

describe('functions', () => {
  test('test authenticate', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 200, ok: true } as Response),
      );
    const client = new Client();
    await client.authenticate('abc', 'bcd');
  });

  test('test authenticate wrong status', async () => {
    global.fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.authenticate('abc', 'bcd')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test generate url', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.generateSignedUrl('abc');
    expect(res.id).toBe('123');
  });

  test('test generate url wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.generateSignedUrl('abc')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test get batch status', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.getBatchStatus('123');
    expect(res.batch_ksuid).toBe('123');
  });

  test('test get batch status wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.getBatchStatus('123')).rejects.toThrow(InvalidStatusCodeError);
  });

  test('test get job result', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            job_ksuid: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.getJobResult('123', '123');
    expect(res.job_ksuid).toBe('123');
  });

  test('test get job result wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.getJobResult('123', '123')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send job single step', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendJobSingleStep('rg', 'aaa');
    expect(res.id).toBe('123');
  });

  test('test send job single step wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendJobSingleStep('rg', 'aaa')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send job', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendJob('rg', './package.json');
    expect(res.id).toBe('123');
  });

  test('test send job wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendJob('rg', './package.json')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send batch', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendBatch('rg', './package.json');
    expect(res.id).toBe('123');
  });

  test('test send batch wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendBatch('rg', './package.json')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send job base64', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendJobBase64('rg', 'aaa');
    expect(res.id).toBe('123');
  });

  test('test send job base64 wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendJobBase64('rg', 'aaa')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send batch base64', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendBatchBase64('rg', 'aaa');
    expect(res.id).toBe('123');
  });

  test('test send batch base64 wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendBatchBase64('rg', 'aaa')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test send batch base64', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: '123',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client();
    const res = await client.sendBatchBase64('rg', 'aaa');
    expect(res.id).toBe('123');
  });

  test('test send batch base64 wrong status', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.sendBatchBase64('rg', 'aaa')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test wait for job done', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            job_ksuid: '123',
            status: 'done',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.waitForJobDone('123', '123');
    expect(res.job_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test wait for job done wrong status', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.waitForJobDone('123', '123')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test wait for job done timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            job_ksuid: '123',
            status: 'processing',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 30, interval: 1 });
    expect(async () => await client.waitForJobDone('123', '123')).rejects.toThrow(TimeoutError);
  });

  test('test wait for batch done', async () => {
    jest.useRealTimers();
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            job_ksuid: '1234',
            status: 'done',
            jobs: [
              {
                job_ksuid: '1234',
                status: 'done',
              },
            ],
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.waitForBatchDone('123');
    expect(res.batch_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test wait for batch done without jobs', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            status: 'done',
            jobs: [],
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.waitForBatchDone('123', false);
    expect(res.batch_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test wait for batch done wrong status', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.waitForBatchDone('123')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test wait for batch done timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            status: 'processing',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 30, interval: 1 });
    expect(async () => await client.waitForBatchDone('123')).rejects.toThrow(TimeoutError);
  });

  test('test create and wait job done', async () => {
    jest.useRealTimers();
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            job_ksuid: '123',
            status: 'done',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.createAndWaitJob('123', './package.json');
    expect(res.job_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test create and wait job done wrong status', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.createAndWaitJob('123', './package.json')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test create and wait job done timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            job_ksuid: '123',
            status: 'processing',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 30, interval: 1 });
    expect(async () => await client.createAndWaitJob('123', './package.json')).rejects.toThrow(
      TimeoutError,
    );
  });

  test('test create and wait batch done', async () => {
    jest.useRealTimers();
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            job_ksuid: '1234',
            status: 'done',
            jobs: [
              {
                job_ksuid: '1234',
                status: 'done',
              },
            ],
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.createAndWaitBatch('123', './package.json');
    expect(res.batch_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test create and wait batch done without jobs', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            status: 'done',
            jobs: [],
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 1, interval: 0.001 });
    const res = await client.createAndWaitBatch('123', './package.json');
    expect(res.batch_ksuid).toBe('123');
    expect(res.status).toBe('done');
  });

  test('test create and wait batch done wrong status', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve({}), status: 403 } as Response),
      );
    const client = new Client();
    expect(async () => await client.createAndWaitBatch('123', './package.json')).rejects.toThrow(
      InvalidStatusCodeError,
    );
  });

  test('test create and wait batch done timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            batch_ksuid: '123',
            status: 'processing',
          }),
        status: 200,
        ok: true,
      } as Response),
    );
    const client = new Client({ timeout: 30, interval: 1 });
    expect(async () => await client.createAndWaitBatch('123', './package.json')).rejects.toThrow(
      TimeoutError,
    );
  });
});
