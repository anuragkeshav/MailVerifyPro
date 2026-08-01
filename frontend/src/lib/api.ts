import axios from 'axios';
import { Job, JobStats, UploadResponse, EmailResult } from './types';

const apiClient = axios.create({
  baseURL: '/api',
});

export const api = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  startVerification: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/start`);
  },

  pauseVerification: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/pause`);
  },

  resumeVerification: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/resume`);
  },

  cancelVerification: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/cancel`);
  },

  getResults: async (jobId: string, params: { page?: number; limit?: number; status?: string; search?: string }): Promise<{ results: EmailResult[]; total: number }> => {
    const response = await apiClient.get(`/jobs/${jobId}/results`, { params });
    return response.data;
  },

  getJobStats: async (jobId: string): Promise<JobStats> => {
    const response = await apiClient.get<JobStats>(`/jobs/${jobId}/stats`);
    return response.data;
  },

  getHistory: async (): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs');
    return response.data;
  },

  getJobDetails: async (jobId: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}`);
  },

  getExportUrl: (jobId: string, status: string = 'all'): string => {
    return `/api/jobs/${jobId}/export?status=${status}`;
  }
};
