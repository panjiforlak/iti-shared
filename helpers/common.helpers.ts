import { randomBytes } from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PinoLogger } from 'nestjs-pino';

interface RateLimitOptions {
  limit?: number;
  ttl?: number;
}

export interface ApiResponse<T = any> {
  statusCode: number | string;
  message: string;
  data?: T;
  trxId?: string;
  error?: boolean;
  timestamp?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  [key: string]: any; // untuk extra fields
}

export function generateTrxId(prefix = 'ITI'): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = [
    pad(now.getDate()),
    pad(now.getMonth() + 1),
    now.getFullYear(),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');

  const mode = process.env.NODE_ENV === 'production' ? 'PRD' : 'DEV';
  const random = randomBytes(5).toString('hex').toUpperCase().slice(0, 5);

  return `${prefix}${mode}${dateStr}${random}`;
}

export function successResponse<T = any>(
  data: T,
  message = 'Retrieve data success',
  statusCode = HttpStatus.OK,
  tz?: string,
): ApiResponse<T> {
  const timestamp = new Date().toISOString();
  return {
    statusCode,
    message,
    data,
    timestamp,
    ...(tz && {
      timezone: {
        offsetZone: tz.toUpperCase(),
        timeLocal: toLocalISOString(timestamp, tz.toUpperCase()),
      },
    }),
  };
}

export function errorResponse(
  message = 'Error',
  statusCode = HttpStatus.BAD_REQUEST,
  extra?: Record<string, any>,
): ApiResponse {
  return {
    statusCode,
    message,
    error: true,
    timestamp: new Date().toISOString(),
    ...(extra || {}),
  };
}

export function paginateResponse<T = any>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
  message = 'Success',
  statusCode = HttpStatus.OK,
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return {
    statusCode,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export function throwError(
  message = 'Bad Request',
  source = '',
  context = '',
  statusCode = HttpStatus.BAD_REQUEST,
  extra?: Record<string, any>,
): never {
  const payload = errorResponse(message, statusCode, extra);
  const exception = new HttpException(payload, statusCode);

  (exception as any).source = source;
  (exception as any).context = context;

  throw exception;
}

export function toCustomUpperCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function gmtToOffset(tz: string): number {
  const match = tz.match(/^GMT([+-]\d{1,2})$/);
  if (!match) return 0; // fallback UTC
  return parseInt(match[1], 10);
}

export function toLocalISOString(utcIso: string, tz: string): string {
  const offset = gmtToOffset(tz);
  const utcDate = new Date(utcIso);
  const local = new Date(utcDate.getTime() + offset * 60 * 60 * 1000);

  return local.toISOString().replace('T', ' ').substring(0, 19);
}

export function RateLimit(options?: RateLimitOptions): MethodDecorator {
  const limit = options?.limit ?? parseInt(process.env.COUNT_HIT ?? '5', 10);
  const ttl = options?.ttl ?? parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10);

  return Throttle({
    default: {
      limit,
      ttl,
    },
  });
}
export class CustomHttpException extends HttpException {
  constructor(
    public message: string,
    public source: string,
    public context: string,
    public statusCode = HttpStatus.BAD_REQUEST,
    public extra?: Record<string, any>,
  ) {
    super(
      {
        statusCode,
        message,
        error: true,
        timestamp: new Date().toISOString(),
        ...extra,
        source,
        context,
      },
      statusCode,
    );
  }
}

export function mapGrpcError(error: any) {
  const errorMap: Record<number, { message: string; status: number }> = {
    3: { message: 'Invalid request parameter', status: 400 },
    5: { message: 'Resource not found', status: 404 },
    7: { message: 'Permission denied', status: 403 },
    13: { message: 'Internal service error', status: 500 },
    14: { message: 'Service unavailable', status: 503 },
  };

  return (
    errorMap[error?.code] || {
      message: error?.message || 'Unexpected service error',
      status: 500,
    }
  );
}
