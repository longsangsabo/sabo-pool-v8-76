import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '../types/club.types';

interface ClubSettings {
  club_name: string;
  address: string;
  phone: string;
  email?: string;
  description?: string;
  district?: string;
  city?: string;
  available_tables?: number; // Map from database field
  amenities?: string[];
  photos?: string[];
  contact_info?: string;
  hourly_rate?: number;
  verification_status?: string;
}

export const useClubSettings = (clubId: string) => {
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Lỗi khi tải cài đặt CLB'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<ClubSettings>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clubId)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Lỗi khi cập nhật cài đặt'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clubId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('club-photos')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('club-photos').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Lỗi khi upload ảnh'
      );
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${clubId}/${fileName}`;

      const { error } = await supabase.storage
        .from('club-photos')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Lỗi khi xóa ảnh'
      );
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchSettings();
    }
  }, [clubId]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadPhoto,
    deletePhoto,
    refetch: fetchSettings,
  };
};
