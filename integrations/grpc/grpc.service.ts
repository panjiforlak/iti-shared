import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { mapGrpcError, throwError } from '@/common/shared/helpers/common.helpers';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GrpcService implements OnModuleInit {
  private services: Record<string, any> = {};

  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject('SSO_SERVICE') private readonly ssoClient?: ClientGrpc,
    // @Optional() @Inject('COURSE_SERVICE') private readonly courseClient?: ClientGrpc,
    // @Optional() @Inject('PAYMENT_SERVICE') private readonly paymentClient?: ClientGrpc,
  ) {}

  onModuleInit() {
    if (this.ssoClient) this.services['sso'] = this.ssoClient.getService<any>('UserService');
    else this.logger.warn('SOURCE_SSO_SERVICE::NOT_AVAILABLE');

    // Note: kamu bisa menambahkan service lain seperti course, payment, dll dengan cara yang sama seperti di atas
    // if (this.courseClient) this.services['course'] = this.courseClient.getService<any>('CourseService');
    // else this.logger.warn('COURSE_SERVICE GRPC_CLIENT NOT_AVAILABLE');

    // if (this.paymentClient) this.services['payment'] = this.paymentClient.getService<any>('PaymentService');
    // else this.logger.warn('PAYMENT_SERVICE GRPC_CLIENT NOT_AVAILABLE');
  }

  async call(service: string, method: string, data: any, fallback: any = null) {
    const grpcService = this.services[service];

    if (!grpcService) {
      this.logger.error(
        { service, method, grpcCode: 400, message: 'gRPC service not found' },
        'GRPC_CALL::SERVICE_NOT_FOUND',
      );
      return fallback; // kembalikan fallback daripada throw
    }

    if (!grpcService[method]) {
      this.logger.error(
        { service, method, grpcCode: 400, message: 'gRPC method not found' },
        'GRPC_CALL::METHOD_NOT_FOUND',
      );
      return fallback;
    }

    try {
      this.logger.info({ service, method, data }, 'GRPC_CALL::REQUEST');
      const response = await firstValueFrom(grpcService[method](data));
      this.logger.info({ service, method }, 'GRPC_CALL::SUCCESS');
      return response;
    } catch (error) {
      const mappedError = mapGrpcError(error);

      this.logger.error(
        {
          service,
          method,
          grpcCode: error?.code,
          message: mappedError.message,
        },
        `GRPC_CALL::${mappedError.message.toUpperCase().replace(/ /g, '_')}`,
      );

      // return fallback (misal {} untuk object atau [] untuk list)
      return fallback;
    }
  }
}
