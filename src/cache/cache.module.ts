import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';
import {
  cacheTtl,
  redisHost,
  redisPassword,
  redisPort,
} from 'src/utils/util.constant';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: redisStore,
        // store: 'memory',
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        ttl: cacheTtl,
      }),
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
