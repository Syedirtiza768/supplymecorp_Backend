import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CounterPointClient {
  private client: AxiosInstance;

  constructor(private readonly cfg: ConfigService) {
    const base = this.cfg.get<string>('COUNTERPOINT_BASE') || 'https://utility.rrgeneralsupply.com/Item';
    const timeout = parseInt(this.cfg.get<string>('COUNTERPOINT_TIMEOUT_MS') || '6000', 10);
    const apiKey = this.cfg.get<string>('COUNTERPOINT_API_KEY') || '';
    const authBasic = this.cfg.get<string>('COUNTERPOINT_AUTH_BASIC') || '';
    const cookie = this.cfg.get<string>('COUNTERPOINT_COOKIE') || '';

    this.client = axios.create({
      baseURL: base,
      timeout,
      headers: {
        APIKey: apiKey,
        Authorization: authBasic,
        ...(cookie ? { Cookie: cookie } : {}),
        Accept: 'application/json',
      },
    });
  }

  async getItemBySku(sku: string): Promise<Record<string, any> | null> {
    try {
      const res = await this.client.get(`/${encodeURIComponent(sku)}`);
      const data = res.data;
      if (data?.ErrorCode !== 'SUCCESS') return null;
      return data?.IM_ITEM ?? null;
    } catch {
      return null;
    }
  }
}
