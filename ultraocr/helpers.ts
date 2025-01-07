import { InvalidStatusCodeError } from './errors';
import { readFileSync } from 'fs';
import { METHOD_PUT } from './constants';

export function validateResponse(response: Response) {
  if (!response.ok) throw new InvalidStatusCodeError(response.status);
}

export async function uploadFile(url: string, body: string | Buffer): Promise<Response> {
  const input = {
    method: METHOD_PUT,
    body,
  };

  const response = await fetch(url, input);
  return response;
}

export async function uploadFileWithPath(url: string, filePath: string): Promise<Response> {
  const file = readFileSync(filePath);
  return uploadFile(url, file);
}
