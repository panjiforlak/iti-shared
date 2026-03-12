import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientsProviderAsyncOptions, GrpcOptions } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync } from 'fs';
import { GrpcService } from './grpc.service';

// buat config object dulu, tapi jangan whitelist client yang invalid yaps.
function getGrpcClients(): ClientsProviderAsyncOptions[] {
  const services = (process.env.GRPC_SERVICES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const clients: ClientsProviderAsyncOptions[] = [];

  for (const service of services) {
    const protoRelPath = process.env[`GRPC_${service.toUpperCase()}_PROTO_PATH`];
    if (!protoRelPath) {
      console.warn(`[GrpcModule] GRPC_${service}_PROTO_PATH not set, skipping client`);
      continue;
    }

    const protoPath = join(process.cwd(), protoRelPath);
    if (!existsSync(protoPath)) {
      console.warn(`[GrpcModule] Proto file for ${service} not found at ${protoPath}, skipping client`);
      continue;
    }

    clients.push({
      name: `${service.toUpperCase()}_SERVICE`,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): GrpcOptions => ({
        transport: Transport.GRPC,
        options: {
          url: config.get<string>(`GRPC_${service.toUpperCase()}_URL`),
          package: config.get<string>(`GRPC_${service.toUpperCase()}_PACKAGE`)!,
          protoPath,
          loader: {
            keepCase: true, // ❗ penting supaya snake_case tidak berubah
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      }),
    });
  }

  return clients;
}

@Module({
  imports: [ClientsModule.registerAsync(getGrpcClients())],
  providers: [GrpcService],
  exports: [GrpcService],
})
export class GrpcModule {}
