import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GAAnalyticsService } from './ga-analytics.service';

@ApiTags('Google Analytics')
@Controller('ga-analytics')
export class GAAnalyticsController {
  constructor(private readonly gaService: GAAnalyticsService) {}

  @Get('top-pages')
  @ApiOperation({ summary: 'Get most visited pages' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getTopPages(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 10,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTopPages(startDate, endDate, limit);
  }

  @Get('top-articles')
  @ApiOperation({ summary: 'Get most read articles' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getTopArticles(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 10,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTopArticles(startDate, endDate, limit);
  }

  @Get('top-members')
  @ApiOperation({ summary: 'Get most searched/viewed members' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getTopMembers(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 10,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTopMembers(startDate, endDate, limit);
  }

  @Get('top-events')
  @ApiOperation({ summary: 'Get most visited event pages' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getTopEvents(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 10,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTopEvents(startDate, endDate, limit);
  }

  @Get('search-analytics')
  @ApiOperation({ summary: 'Get search query analytics' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getSearchAnalytics(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 20,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getSearchAnalytics(startDate, endDate, limit);
  }

  @Get('user-behavior')
  @ApiOperation({ summary: 'Get user behavior summary' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  async getUserBehavior(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getUserBehaviorSummary(startDate, endDate);
  }

  @Get('user-types')
  @ApiOperation({ summary: 'Get user type breakdown (guest vs authenticated)' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  async getUserTypes(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getUserTypeBreakdown(startDate, endDate);
  }

  @Get('traffic-by-country')
  @ApiOperation({ summary: 'Get traffic by country' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({ name: 'limit', required: false })
  async getTrafficByCountry(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('limit') limit: number = 10,
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTrafficByCountry(startDate, endDate, limit);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time active users' })
  async getRealTimeUsers() {
    return this.gaService.getRealTimeUsers();
  }

  @Get('traffic-over-time')
  @ApiOperation({ summary: 'Get traffic over time' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  @ApiQuery({
    name: 'granularity',
    enum: ['date', 'week', 'month'],
    required: false,
  })
  async getTrafficOverTime(
    @Query('period')
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    @Query('granularity') granularity: 'date' | 'week' | 'month' = 'date',
  ) {
    const { startDate, endDate } = this.gaService.getDateRange(period);
    return this.gaService.getTrafficOverTime(startDate, endDate, granularity);
  }
}
