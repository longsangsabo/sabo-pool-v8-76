import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TournamentPrizeTemplate {
  id: string;
  template_name: string;
  tournament_type: string;
  participant_range_min: number;
  participant_range_max: number;
  prize_structure: any[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useTournamentPrizeTemplates = () => {
  const [templates, setTemplates] = useState<TournamentPrizeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournament_prize_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching tournament prize templates:', error);
      // Return empty array if table doesn't exist yet
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async (templateData: Omit<TournamentPrizeTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tournament_prize_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      toast.success('Tournament prize template created successfully');
    } catch (error) {
      console.error('Error creating tournament prize template:', error);
      toast.error('Failed to create tournament prize template. Make sure the tournament_prize_templates table exists.');
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<Omit<TournamentPrizeTemplate, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('tournament_prize_templates')
        .update(templateData)
        .eq('id', id);

      if (error) throw error;

      await fetchTemplates();
      toast.success('Tournament prize template updated successfully');
    } catch (error) {
      console.error('Error updating tournament prize template:', error);
      toast.error('Failed to update tournament prize template. Make sure the tournament_prize_templates table exists.');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournament_prize_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTemplates();
      toast.success('Tournament prize template deleted successfully');
    } catch (error) {
      console.error('Error deleting tournament prize template:', error);
      toast.error('Failed to delete tournament prize template. Make sure the tournament_prize_templates table exists.');
    }
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
