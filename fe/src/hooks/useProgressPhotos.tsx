import { useState, useCallback, useEffect } from 'react';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

export interface ProgressPhotoRecord {
  _id: string;
  member: string;
  frontPhoto?: string;
  sidePhoto?: string;
  backPhoto?: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
  takenAt: string;
  createdAt: string;
  updatedAt: string;
}

export const useProgressPhotos = () => {
  const [timeline, setTimeline] = useState<ProgressPhotoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/progress-photos/timeline`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTimeline(data.timeline);
      }
    } catch (err) {
      console.error('Failed to fetch progress timeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const uploadPhotos = useCallback(async (formData: FormData): Promise<{ success: boolean; message: string }> => {
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/progress-photos/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh timeline after successful upload
        await fetchTimeline();
        return { success: true, message: 'Progress recorded successfully!' };
      }
      return { success: false, message: data.message || 'Failed to upload photos.' };
    } catch {
      return { success: false, message: 'Network error during upload.' };
    } finally {
      setUploading(false);
    }
  }, [fetchTimeline]);

  return {
    timeline,
    loading,
    uploading,
    fetchTimeline,
    uploadPhotos,
  };
};
export default useProgressPhotos;
