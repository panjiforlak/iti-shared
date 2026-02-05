import { randomBytes } from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  trxId?: string;
}

/** ----------------------------- Public Function ----------------------------- */

function generateTrxId(prefix = 'ITIL'): string {
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

  let mode = 'DEV';
  if (process.env.NODE_ENV === 'production') mode = 'PRD';

  const random = randomBytes(5).toString('hex').toUpperCase().slice(0, 5);
  return `${prefix}${mode}${dateStr}${random}`;
}

function successResponse<T = any>(data: T, message = 'Retrieve data success', statusCode = 200): ApiResponse<T> {
  return {
    statusCode,
    message,
    data,
    trxId: generateTrxId(),
  };
}

function errorResponse(message = 'Error', statusCode = 400, error = true, extra?: Record<string, any>) {
  return {
    statusCode,
    message,
    error,
    trxId: generateTrxId(),
    ...(extra || {}),
    timestamp: new Date().toISOString(),
  };
}

function paginateResponse<T = any>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
  message = 'Success',
  statusCode = 200,
) {
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
    trxId: generateTrxId(),
  };
}

function throwError(message = 'Bad Request', statusCode: number = HttpStatus.BAD_REQUEST): never {
  throw new HttpException({ message, trxId: generateTrxId() }, statusCode);
}

export { generateTrxId, ApiResponse, successResponse, errorResponse, paginateResponse, throwError };
