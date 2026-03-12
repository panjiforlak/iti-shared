import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';

export interface HttpCallOptions {
  headers?: Record<string, any>;
  params?: Record<string, any>;
  timeout?: number;
}

@Injectable()
export class HttpCallService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: PinoLogger,
  ) {}

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    bodyOrOptions?: any,
    options?: HttpCallOptions,
    fallback?: T, // tambahkan fallback
  ): Promise<T> {
    try {
      this.logger.info({ method, url, body: bodyOrOptions, options }, 'HTTP_CALL::REQUEST');

      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url,
          data: ['post', 'put'].includes(method) ? bodyOrOptions : undefined,
          headers: options?.headers,
          params: options?.params,
          timeout: options?.timeout || 5000,
        }),
      );

      this.logger.info({ method, url, status: response.status }, 'HTTP_CALL::SUCCESS');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Unexpected HTTP error';
      const status = err.response?.status || 500;

      // log error
      this.logger.error({ method, url, status, message }, 'HTTP_CALL::ERROR');

      // fallback jika disediakan, misal {} atau []
      if (fallback !== undefined) return fallback;

      // default fallback: {} untuk object, [] untuk array
      if (method === 'get' || method === 'post') return {} as T;
      return [] as unknown as T;
    }
  }

  get<T>(url: string, options?: HttpCallOptions, fallback?: T) {
    return this.request<T>('get', url, undefined, options, fallback);
  }

  post<T>(url: string, body: any, options?: HttpCallOptions, fallback?: T) {
    return this.request<T>('post', url, body, options, fallback);
  }

  put<T>(url: string, body: any, options?: HttpCallOptions, fallback?: T) {
    return this.request<T>('put', url, body, options, fallback);
  }

  delete<T>(url: string, options?: HttpCallOptions, fallback?: T) {
    return this.request<T>('delete', url, undefined, options, fallback);
  }
}
