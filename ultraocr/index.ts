import {
  POOLING_INTERVAL,
  API_TIMEOUT,
  BASE_URL,
  AUTH_BASE_URL,
  DEFAULT_EXPIRATION_TIME,
} from './constants';

export type Config = {
  clientID: string;
  clientSecret: string;
  expires: number;
  autoRefresh: boolean;
  authBaseUrl: string;
  baseUrl: string;
  timeout: number;
  interval: number;
};

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

  constructor(config: Config) {
    this.clientID = config.clientID || '';
    this.clientSecret = config.clientSecret || '';
    this.expires = config.expires || DEFAULT_EXPIRATION_TIME;
    this.autoRefresh = config.autoRefresh || false;
    this.authBaseUrl = config.authBaseUrl || AUTH_BASE_URL;
    this.baseUrl = config.baseUrl || BASE_URL;
    this.timeout = config.timeout || API_TIMEOUT;
    this.interval = config.interval || POOLING_INTERVAL;
    this.token = '';
    this.expiresAt = new Date();
  }

  private async request(
    endpoint: string,
    method: string,
    body: string,
    params: Record<string, string>,
  ) {
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

  private async post(endpoint: string, body: Record<string, any>, params: Record<string, string>) {
    return await this.request(endpoint, 'POST', JSON.stringify(body), params);
  }

  private async get(endpoint: string, params: Record<string, string>) {
    return await this.request(endpoint, 'POST', '', params);
  }

  private async autoAuthenticate() {
    if (this.autoRefresh && new Date() > this.expiresAt)
      await this.authenticate(this.clientID, this.clientSecret, this.expires);
  }

  public async authenticate(
    clientID: string,
    clientSecret: string,
    expires: number = DEFAULT_EXPIRATION_TIME,
  ) {
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
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };

    const response = await fetch(url, input);
    if (response.ok) {
      const res = await response.json();
      this.token = res.token;
      const now = new Date();
      this.expiresAt = new Date(now.getTime() + expires * 60 * 1000);
    }
  }

  public async generateSignedUrl(
    service: string,
    metadata: Record<string, any>,
    params: Record<string, string>,
    resource: string = 'job',
  ) {
    const url = `${this.baseUrl}/ocr/${resource}/${service}`;
    const resp = await this.post(url, metadata, (params = params));
    if (resp.ok) {
      const res = await resp.json();
      return res;
    }
  }
}
