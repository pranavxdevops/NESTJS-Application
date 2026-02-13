import { apiClient } from '@/lib/api/apiClient';
import type {
  NetworkResponse,
  ConnectionRequest,
  Connection,
  SuggestedMember,
} from '../types';

export const networkService = {
  /**
   * Send a connection request
   */
  async sendConnectionRequest(recipientId: string, note?: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.post('/wfzo/api/v1/connections/request', {
      recipientId,
      note,
    });
    return response.data;
  },

  /**
   * Accept a connection request
   */
  async acceptConnectionRequest(requestId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.put(`/wfzo/api/v1/connections/${requestId}/accept`);
    return response.data;
  },

  /**
   * Reject a connection request
   */
  async rejectConnectionRequest(requestId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.put(`/wfzo/api/v1/connections/${requestId}/reject`);
    return response.data;
  },

  /**
   * Block a user (deprecated - kept for backward compatibility)
   */
  async blockUser(connectionId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.put(`/wfzo/api/v1/connections/${connectionId}/block`);
    return response.data;
  },

  /**
   * Unblock a user (deprecated - kept for backward compatibility)
   */
  async unblockUser(connectionId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.put(`/wfzo/api/v1/connections/${connectionId}/unblock`);
    return response.data;
  },

  /**
   * Block a member (organization)
   */
  async blockMember(connectionId: string, blockedMemberId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.post(`/wfzo/api/v1/connections/${connectionId}/block-member`, {
      blockedMemberId,
    });
    return response.data;
  },

  /**
   * Unblock a member (organization)
   */
  async unblockMember(connectionId: string, unblockedMemberId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.post(`/wfzo/api/v1/connections/${connectionId}/unblock-member`, {
      unblockedMemberId,
    });
    return response.data;
  },

  /**
   * Remove a connection
   */
  async removeConnection(connectionId: string): Promise<NetworkResponse<any>> {
    const response = await apiClient.delete(`/wfzo/api/v1/connections/${connectionId}`);
    return response.data;
  },

  /**
   * Report a user
   */
  async reportUser(reportedMemberId: string, reportedUserId: string | null, reason: string): Promise<NetworkResponse<any>> {
    const payload: any = {
      reportedMemberId,
      reason,
    };
    
    // Only include reportedUserId if it's provided (for team members)
    if (reportedUserId) {
      payload.reportedUserId = reportedUserId;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/report', payload);
    return response.data;
  },

  /**
   * Get my connections
   */
  async getMyConnections(page: number = 1, pageSize: number = 10): Promise<NetworkResponse<Connection[]>> {
    const response = await apiClient.get('/wfzo/api/v1/connections', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get received connection requests (invitations)
   */
  async getReceivedRequests(page: number = 1, pageSize: number = 10): Promise<NetworkResponse<ConnectionRequest[]>> {
    const response = await apiClient.get('/wfzo/api/v1/connections/requests/received', {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getSentRequests(page:number=1,pageSize:number=10):Promise<NetworkResponse<ConnectionRequest[]>>{
    const response=await apiClient.get('wfzo/api/v1/connections/requests/sent',{
      params:{page,pageSize},
    });
    return response.data;
  },
  /**
   * Get suggested members
   */
  async getSuggestedMembers(page: number = 1, pageSize: number = 5): Promise<NetworkResponse<SuggestedMember[]>> {
    const response = await apiClient.get('/wfzo/api/v1/connections/suggestions', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Check if connected with a user
   */
  async checkConnection(userId: string): Promise<NetworkResponse<{ isConnected: boolean }>> {
    const response = await apiClient.get(`/wfzo/api/v1/connections/check/${userId}`);
    return response.data;
  },
};
