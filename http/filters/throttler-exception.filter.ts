import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { PinoLogger } from 'nestjs-pino';
import { generateTrxId } from 'src/common/shared/helpers/common.helpers';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const trxId = (request.headers['x-transaction-id'] as string) || generateTrxId();

    this.logger.warn(
      {
        traceId: trxId,
        method: request.method,
        path: request.originalUrl,
        statusCode: 429,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      'API_ABUSE_DETECTED',
    );

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too Many Requests',
      data: { error: true },
      trxId,
    });
  }
}
