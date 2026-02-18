import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface PartnerApplication {
  id: string;
  user_id: string;
  full_name: string;
  contact_number: string;
  email: string;
  status: ApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get current user's application status
export function useMyApplication() {
  return useQuery({
    queryKey: ['my-partner-application'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dairy_partner_applications')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as PartnerApplication | null;
    },
  });
}

// Get all applications (admin only)
export function useAllApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: ['partner-applications', status],
    queryFn: async () => {
      let query = supabase
        .from('dairy_partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerApplication[];
    },
  });
}

// Submit a new partner application
export function useSubmitApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      full_name: string;
      contact_number: string;
      email: string;
    }) => {
      const { data, error } = await supabase
        .from('dairy_partner_applications')
        .insert({
          user_id: input.user_id,
          full_name: input.full_name,
          contact_number: input.contact_number,
          email: input.email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-partner-application'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Approve a partner application (admin only)
export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, userId }: { applicationId: string; userId: string }) => {
      // 1. Update application status
      const { error: appError } = await supabase
        .from('dairy_partner_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 2. Assign 'user' role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'user' }, { onConflict: 'user_id,role' });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast({ title: 'Application approved', description: 'The partner can now log in.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Reject a partner application (admin only)
export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      applicationId,
      rejectionReason,
    }: {
      applicationId: string;
      rejectionReason: string;
    }) => {
      const { error } = await supabase
        .from('dairy_partner_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast({ title: 'Application rejected', description: 'The partner has been notified.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
