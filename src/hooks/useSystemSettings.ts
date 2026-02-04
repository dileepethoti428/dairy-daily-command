import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusinessInfo {
  name: string;
  currency: string;
  contact_email: string;
  contact_phone: string;
}

export interface OperationalSettings {
  default_unit: string;
  settlement_cycle_days: number;
}

export interface PricingConfig {
  enabled: boolean;
  rate_slabs: Array<{
    min_fat: number;
    max_fat: number;
    rate: number;
  }>;
}

export interface SystemSettings {
  business_info: BusinessInfo;
  operational_settings: OperationalSettings;
  pricing_config: PricingConfig;
}

// Fetch all system settings
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      // Transform array to object
      const settings: Partial<SystemSettings> = {};
      for (const row of data || []) {
        if (row.setting_key === 'business_info') {
          settings.business_info = row.setting_value as unknown as BusinessInfo;
        } else if (row.setting_key === 'operational_settings') {
          settings.operational_settings = row.setting_value as unknown as OperationalSettings;
        } else if (row.setting_key === 'pricing_config') {
          settings.pricing_config = row.setting_value as unknown as PricingConfig;
        }
      }

      return settings as SystemSettings;
    },
  });
}

// Update business info
export function useUpdateBusinessInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (businessInfo: BusinessInfo) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ setting_value: JSON.parse(JSON.stringify(businessInfo)) })
        .eq('setting_key', 'business_info')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Business information has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
