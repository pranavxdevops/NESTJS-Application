import { Module } from '@nestjs/common';
import { GAAnalyticsService } from './ga-analytics.service';
import { GAAnalyticsController } from './ga-analytics.controller';

@Module({
  controllers: [GAAnalyticsController],
  providers: [GAAnalyticsService],
  exports: [GAAnalyticsService],
})
export class GAAnalyticsModule {}
