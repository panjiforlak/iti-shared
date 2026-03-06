import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal Server Error' };

    response.status(status).json({
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
      trxId: request.headers['x-transaction-id'] || request.trxId,
    });
  }
}
