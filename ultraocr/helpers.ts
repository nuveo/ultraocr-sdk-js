import { InvalidStatusCodeError } from './errors';
import { readFileSync } from 'fs';

export function validateResponse(response: Response) {
  if (!response.ok) throw new InvalidStatusCodeError(response.status);
}

export async function uploadFile(url: string, body: string): Promise<any> {
  const input = {
    method: 'PUT',
    body,
  };

  const response = await fetch(url, input);
  return response;
}

export async function uploadFileWithPath(url: string, filePath: string): Promise<any> {
  const file = readFileSync(filePath, 'utf-8');
  return uploadFile(url, file);
}
