import {
    POOLING_INTERVAL,
    API_TIMEOUT,
    BASE_URL,
    AUTH_BASE_URL,
    DEFAULT_EXPIRATION_TIME
} from "./constants"

export type Config = {
    client_id: string;
    client_secret: string;
    expires: number;
    auto_refresh: boolean;
    auth_base_url: string;
    base_url: string;
    timeout: number;
    interval: number;
}

export class Client {

    client_id: string;
    client_secret: string;
    expires: number;
    auto_refresh: boolean;
    auth_base_url: string;
    base_url: string;
    timeout: number;
    interval: number;
    token: string;
    expires_at: Date;

    constructor(config: Config) {
        this.client_id = config.client_id || "";
        this.client_secret = config.client_secret || "";
        this.expires = config.expires || DEFAULT_EXPIRATION_TIME;
        this.auto_refresh = config.auto_refresh || false;
        this.auth_base_url = config.auth_base_url || AUTH_BASE_URL;
        this.base_url = config.base_url || BASE_URL;
        this.timeout = config.timeout || API_TIMEOUT;
        this.interval = config.interval || POOLING_INTERVAL;
        this.token = "";
        this.expires_at = new Date();
    }

    private async request(endpoint: string, method: string, body: string, params: Record<string, string>) {
        await this.autoAuthenticate()

        const urlParams = new URLSearchParams(params).toString();
        const url = `${endpoint}?${urlParams}`;

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`,
        };
        const input = {
            method,
            headers,
            body: JSON.stringify(body),
        };

        const response = await fetch(url, input);
        return response;
    }

    private async post(endpoint: string, body: Record<string,any>, params: Record<string, string>) {
        return await this.request(endpoint, "POST", JSON.stringify(body), params);
    }

    private async get(endpoint: string, params: Record<string, string>) {
        return await this.request(endpoint, "POST", "", params);
    }

    private async autoAuthenticate() {
        if (this.auto_refresh && new Date() > this.expires_at)
            await this.authenticate(this.client_id, this.client_secret, this.expires)
    } 
       

    public async authenticate(client_id: string, client_secret: string, expires: number = DEFAULT_EXPIRATION_TIME) {
        const url = `${this.auth_base_url}/token`;

        const headers = {
            "Content-Type": "application/json",
        };
        const data = {
            "ClientID": client_id,
            "ClientSecret": client_secret,
            "ExpiresIn": expires,
        }

        const input = {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        };

        const response = await fetch(url, input);
        if (response.ok) {
            const res = await response.json();
            this.token = res.token;
            const now = new Date()
            this.expires_at = new Date(now.getTime() + (expires * 60 * 1000))
        }
    }

    public async generateSignedUrl(service: string, metadata: Record<string,any>, params: Record<string, string>, resource: string = "job") {
        const url = `${this.base_url}/ocr/${resource}/${service}`;
        const resp = await this.post(url, metadata, params=params);
        if (resp.ok) {
            const res = await resp.json();
            return res;
        }
    }
}