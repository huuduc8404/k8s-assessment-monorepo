import { Module } from '@nestjs/common';
import { HealthResolver } from './health.resolver';

@Module({
  providers: [HealthResolver],
  exports: [HealthResolver],
})
export class HealthModule {}