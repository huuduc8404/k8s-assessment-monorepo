import { Resolver, Query } from '@nestjs/graphql';
import { HealthStatus } from './health.dto';

@Resolver()
export class HealthResolver {
  @Query(() => HealthStatus)
  health(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}