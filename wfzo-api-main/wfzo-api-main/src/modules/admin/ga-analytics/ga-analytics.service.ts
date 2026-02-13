import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

@Injectable()
export class GAAnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(GAAnalyticsService.name);
  private analyticsClient?: BetaAnalyticsDataClient;
  private propertyId?: string;

  onModuleInit() {
    // Initialize with service account credentials
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY;
    this.propertyId = process.env.GA_PROPERTY_ID;

    if (!clientEmail || !privateKey || !this.propertyId) {
      this.logger.warn(
        'GA4 credentials not configured. Analytics endpoints will not work.',
      );
      return;
    }

    this.analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });

    this.logger.log('Google Analytics Data API client initialized');
  }

  // Get top pages
  async getTopPages(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    });

    return (
      response.rows?.map((row) => ({
        pagePath: row.dimensionValues?.[0]?.value,
        pageTitle: row.dimensionValues?.[1]?.value,
        pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
        totalUsers: parseInt(row.metricValues?.[1]?.value || '0'),
        newUsers: parseInt(row.metricValues?.[2]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
      })) || []
    );
  }

  // Get top articles (using custom event)
  async getTopArticles(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    try {
      const [response] = await this.analyticsClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'customEvent:article_id' },
          { name: 'customEvent:article_title' },
        ],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'article_read' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit,
      });

      this.logger.log(
        `Top Articles Query: ${startDate} to ${endDate}, Rows: ${response.rows?.length || 0}`,
      );
      
      if (!response.rows || response.rows.length === 0) {
        this.logger.warn('No article_read events found. Custom dimensions may not be active yet.');
      }

      return (
        response.rows?.map((row) => ({
          articleId: row.dimensionValues?.[0]?.value,
          title: row.dimensionValues?.[1]?.value,
          views: parseInt(row.metricValues?.[0]?.value || '0'),
          uniqueReaders: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || []
      );
    } catch (error) {
      this.logger.error(
        'Error fetching top articles:',
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  // Get most searched/viewed members
  async getTopMembers(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    try {
      const [response] = await this.analyticsClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'customEvent:member_id' },
          { name: 'customEvent:member_name' },
          // Note: organization dimension removed until it's created in GA4
        ],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'member_view' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit,
      });

      this.logger.log(
        `Top Members Query: ${startDate} to ${endDate}, Rows: ${response.rows?.length || 0}`,
      );
      
      if (!response.rows || response.rows.length === 0) {
        this.logger.warn('No member_view events found. Custom dimensions may not be active yet.');
      }

      return (
        response.rows?.map((row) => ({
          memberId: row.dimensionValues?.[0]?.value,
          memberName: row.dimensionValues?.[1]?.value,
          organization: '', // Will be populated once organization dimension is created in GA4
          profileViews: parseInt(row.metricValues?.[0]?.value || '0'),
          uniqueViewers: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || []
      );
    } catch (error) {
      this.logger.error(
        'Error fetching top members:',
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  // Get top events
  async getTopEvents(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    try {
      const [response] = await this.analyticsClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'customEvent:event_id' },
          { name: 'customEvent:event_title' },
          { name: 'customEvent:event_type' },
        ],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'event_view' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit,
      });

      this.logger.log(
        `Top Events Query: ${startDate} to ${endDate}, Rows: ${response.rows?.length || 0}`,
      );
      
      if (!response.rows || response.rows.length === 0) {
        this.logger.warn('No event_view events found. Custom dimensions may not be active yet.');
      }

      return (
        response.rows?.map((row) => ({
          eventId: row.dimensionValues?.[0]?.value,
          eventTitle: row.dimensionValues?.[1]?.value,
          eventType: row.dimensionValues?.[2]?.value,
          pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
          uniqueVisitors: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || []
      );
    } catch (error) {
      this.logger.error(
        'Error fetching top events:',
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  // Get search analytics
  async getSearchAnalytics(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 20,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    try {
      const [response] = await this.analyticsClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:search_term' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'member_search' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit,
      });

      this.logger.log(
        `Search Analytics Query: ${startDate} to ${endDate}, Rows: ${response.rows?.length || 0}`,
      );
      
      if (!response.rows || response.rows.length === 0) {
        this.logger.warn('No member_search events found. Custom dimensions may not be active yet.');
      }

      return (
        response.rows?.map((row) => ({
          searchTerm: row.dimensionValues?.[0]?.value,
          searchCount: parseInt(row.metricValues?.[0]?.value || '0'),
          uniqueSearchers: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || []
      );
    } catch (error) {
      this.logger.error(
        'Error fetching search analytics:',
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  // Get user behavior summary
  async getUserBehaviorSummary(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagedSessions' },
      ],
    });

    const row = response.rows?.[0];
    return {
      totalUsers: parseInt(row?.metricValues?.[0]?.value || '0'),
      newUsers: parseInt(row?.metricValues?.[1]?.value || '0'),
      sessions: parseInt(row?.metricValues?.[2]?.value || '0'),
      pageViews: parseInt(row?.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(row?.metricValues?.[4]?.value || '0'),
      bounceRate: parseFloat(row?.metricValues?.[5]?.value || '0'),
      engagedSessions: parseInt(row?.metricValues?.[6]?.value || '0'),
    };
  }

  // Get user type breakdown (guest vs authenticated)
  async getUserTypeBreakdown(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'customUser:user_type' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
    });

    return (
      response.rows?.map((row) => ({
        userType: row.dimensionValues?.[0]?.value || 'unknown',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      })) || []
    );
  }

  // Get traffic by country
  async getTrafficByCountry(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    limit: number = 10,
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit,
    });

    return (
      response.rows?.map((row) => ({
        country: row.dimensionValues?.[0]?.value,
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      })) || []
    );
  }

  // Get real-time active users
  async getRealTimeUsers() {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runRealtimeReport({
      property: `properties/${this.propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    return {
      activeUsers: parseInt(
        response.rows?.[0]?.metricValues?.[0]?.value || '0',
      ),
    };
  }

  // Get traffic over time (for charts)
  async getTrafficOverTime(
    startDate: string = '30daysAgo',
    endDate: string = 'today',
    granularity: 'date' | 'week' | 'month' = 'date',
  ) {
    if (!this.analyticsClient) {
      throw new Error('Analytics client not initialized');
    }

    const [response] = await this.analyticsClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: granularity }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: granularity }, desc: false }],
    });

    return (
      response.rows?.map((row) => ({
        period: row.dimensionValues?.[0]?.value,
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      })) || []
    );
  }

  // Helper to convert period to date range
  getDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): { startDate: string; endDate: string } {
    const endDate = 'today';
    let startDate: string;

    switch (period) {
      case 'daily':
        startDate = 'yesterday';
        break;
      case 'weekly':
        startDate = '7daysAgo';
        break;
      case 'monthly':
        startDate = '30daysAgo';
        break;
      case 'yearly':
        startDate = '365daysAgo';
        break;
      default:
        startDate = '30daysAgo';
    }

    return { startDate, endDate };
  }
}
