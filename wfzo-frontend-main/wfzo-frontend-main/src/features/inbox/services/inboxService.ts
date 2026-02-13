import { apiClient } from '@/lib/api/apiClient';
import type { InboxResponse, Connection } from '../types';

export const inboxService = {
  /**
   * Get my connections for inbox/chat
   * Fetches all accepted connections of the logged-in user
   */
  async getMyConnections(
    page: number = 1,
    pageSize: number = 50,
    searchQuery?: string
  ): Promise<InboxResponse<Connection[]>> {
    const response = await apiClient.get('/wfzo/api/v1/connections', {
      params: { 
        page, 
        pageSize,
        search: searchQuery 
      },
    });
    return response.data;
  },

  /**
   * Search connections by company name
   */
  async searchConnections(query: string): Promise<InboxResponse<Connection[]>> {
    return this.getMyConnections(1, 50, query);
  },
};
