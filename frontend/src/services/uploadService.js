import { apiClient } from '../lib/axios';
import axios from 'axios';

class UploadService {
  async initUpload(file, folderId = null) {
    const response = await apiClient.post('/files/init-upload', {
      filename: file.name,
      size: file.size,
      mime_type: file.type || 'application/octet-stream',
      folder_id: folderId === 'root' ? null : folderId
    });
    return response.data;
  }

  async uploadFileToStorage(file, uploadData, onProgress, cancelToken) {
    const { presigned_url, form_data } = uploadData;

    // Local dev fallback if S3 is not configured
    if (presigned_url === 'http://mock-storage.local') {
      return this._simulateMockUpload(file, onProgress, cancelToken);
    }

    // Real object storage upload
    if (!form_data || Object.keys(form_data).length === 0) {
      // Use PUT request since there are no form fields (Supabase S3 compatibility uses PUT)
      await axios.put(presigned_url, file, {
        cancelToken: cancelToken,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      });
      return;
    }

    // Fallback to standard AWS S3 POST with form_data
    const formData = new FormData();
    Object.entries(form_data || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file); // MUST be last

    await axios.post(presigned_url, formData, {
      cancelToken: cancelToken,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    });
  }

  async completeUpload(fileId) {
    const response = await apiClient.post('/files/complete-upload', {
      file_id: fileId
    });
    return response.data;
  }

  /**
   * Orchestrates the upload flow.
   */
  async uploadFile(file, folderId, onProgress, cancelToken) {
    // 1. Initialize upload
    const uploadData = await this.initUpload(file, folderId);
    
    // 2. Upload to storage
    await this.uploadFileToStorage(file, uploadData, onProgress, cancelToken);
    
    // 3. Complete upload
    await this.completeUpload(uploadData.file_id);
    
    return uploadData.file_id;
  }

  // --- Helpers ---

  _simulateMockUpload(file, onProgress, cancelToken) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const simulatedSpeedBytesPerMs = 2500; 
      const totalTimeMs = Math.max(500, file.size / simulatedSpeedBytesPerMs);
      const updateInterval = 100;
      const increment = (updateInterval / totalTimeMs) * 100;

      const timer = setInterval(() => {
        if (cancelToken?.reason) {
          clearInterval(timer);
          reject(cancelToken.reason);
          return;
        }

        progress += increment;
        const jitter = (Math.random() - 0.5) * 5;
        let currentProgress = Math.min(99, Math.round(progress + jitter));

        if (progress >= 100) {
          clearInterval(timer);
          onProgress(100);
          resolve();
        } else {
          onProgress(Math.max(0, currentProgress));
        }
      }, updateInterval);
    });
  }
}

export const uploadService = new UploadService();
