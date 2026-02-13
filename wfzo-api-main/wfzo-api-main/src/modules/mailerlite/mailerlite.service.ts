import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerLiteService {
  private readonly logger = new Logger(MailerLiteService.name);
  private readonly baseUrl = 'https://api.mailerlite.com/api/v2';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('MAILERLITE_API_KEY');
    const groupId = this.configService.get<string>('MAILERLITE_GROUP_ID');
    this.logger.log(`MailerLite API Key configured: ${!!apiKey}`);
    this.logger.log(`MailerLite Group ID: ${groupId}`);
  }

  private get headers() {
    const apiKey = this.configService.get<string>('MAILERLITE_API_KEY');
    if (!apiKey) {
      throw new Error('MAILERLITE_API_KEY is not configured');
    }
    return {
      'X-MailerLite-ApiKey': apiKey,
      'Content-Type': 'application/json',
    };
  }

  private get defaultGroupId() {
    return this.configService.get<string>('MAILERLITE_GROUP_ID');
  }

  /**
   * Create or update a subscriber
   */
  async upsertSubscriber(
    email: string,
    fields?: Record<string, any>,
    groups?: string[],
  ) {
    try {
      // Ensure default group is included
      const subscriberGroups = this.defaultGroupId
        ? [...(groups || []), this.defaultGroupId].filter((group, index, arr) => arr.indexOf(group) === index)
        : groups;

      this.logger.log(`Upserting subscriber ${email} with groups: ${JSON.stringify(subscriberGroups)}`);

      const requestBody: any = {
        email,
        fields,
      };

      const response = await fetch(`${this.baseUrl}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error('MailerLite API error:', data);
        throw new Error(data?.error?.message || data?.message || 'MailerLite API error');
      }

      // If groups were specified, assign them after subscriber creation
      if (subscriberGroups && subscriberGroups.length > 0) {
        const subscriberId = data.id;
        for (const groupId of subscriberGroups) {
          try {
            await this.addSubscriberToGroup(email, groupId);
          } catch (groupError) {
            this.logger.warn(`Failed to add subscriber ${email} to group ${groupId}:`, groupError);
          }
        }
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to upsert subscriber', error);
      throw error;
    }
  }

  /**
   * Get subscriber by email
   */
  async getSubscriber(email: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/subscribers/${encodeURIComponent(email)}`,
        {
          headers: this.headers,
        },
      );

      const data = await response.json();

      // Check for 404 or if the response indicates subscriber not found
      if (response.status === 404 || data?.error?.code === 404 || data?.message?.includes('not found')) {
        return null;
      }

      if (!response.ok) {
        this.logger.error('MailerLite API error:', data);
        throw new Error(data?.error?.message || data?.message || 'MailerLite API error');
      }

      // Additional check: ensure we have valid subscriber data
      if (!data || !data.id || !data.email) {
        this.logger.warn(`Invalid subscriber data received for ${email}:`, data);
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get subscriber', error);
      throw error;
    }
  }

  /**
   * Delete subscriber
   */
  async deleteSubscriber(email: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/subscribers/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: this.headers,
        },
      );

      // For DELETE requests, check if response has content before parsing JSON
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, treat as empty response
          this.logger.warn('Failed to parse DELETE response as JSON, treating as empty response');
        }
      }

      if (!response.ok) {
        this.logger.error('Delete subscriber failed:', data || { status: response.status, statusText: response.statusText });
        throw new Error(data?.message || data?.error?.message || `Failed to delete subscriber: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to delete subscriber', error);
      throw error;
    }
  }

  /**
   * Get all groups
   */
  async getGroups() {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        headers: this.headers,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(data);
        throw new Error(data?.message || 'MailerLite API error');
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get groups', error);
      throw error;
    }
  }

  /**
   * Create a new group
   */
  async createGroup(name: string) {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(data);
        throw new Error(data?.message || 'MailerLite API error');
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to create group', error);
      throw error;
    }
  }

  /**
   * Get subscribers in a group
   */
  async getGroupSubscribers(groupId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/subscribers`, {
        headers: this.headers,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(data);
        throw new Error(data?.message || 'MailerLite API error');
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get group subscribers', error);
      throw error;
    }
  }

  /**
   * Add subscriber to a group
   */
  async addSubscriberToGroup(email: string, groupId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(data);
        throw new Error(data?.message || 'MailerLite API error');
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to add subscriber to group', error);
      throw error;
    }
  }

  /**
   * Remove subscriber from a group
   */
  async removeSubscriberFromGroup(email: string, groupId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/subscribers/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: this.headers,
        },
      );

      // For DELETE requests, check if response has content before parsing JSON
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, treat as empty response
          this.logger.warn('Failed to parse DELETE response as JSON, treating as empty response');
        }
      }

      if (!response.ok) {
        this.logger.error('Remove subscriber from group failed:', data || { status: response.status, statusText: response.statusText });
        throw new Error(data?.message || data?.error?.message || `Failed to remove subscriber from group: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to remove subscriber from group', error);
      throw error;
    }
  }
}