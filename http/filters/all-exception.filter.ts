import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { generateTrxId } from 'src/common/shared/helpers/common.helpers';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const res = exception.getResponse();

    const trxId = (request.headers['x-transaction-id'] as string) || generateTrxId();

    // 👇 HANDLE THROTTLER DI SINI
    if (exception instanceof ThrottlerException) {
      return response.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        data: { error: true },
        trxId,
      });
    }

    const payload = typeof res === 'string' ? { message: res } : (res as Record<string, any>);

    response.status(status).json({
      statusCode: payload.statusCode || status,
      message: payload.message || 'Error',
      data: payload.data || { error: true },
      trxId,
    });
  }
}
