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
    const formData = new FormData();
    
    // Add all fields required by the presigned POST (e.g., S3 fields)
    Object.entries(form_data || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // The file MUST be the last field in S3
    formData.append('file', file);

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
