import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ApplicationStatus } from '@/hooks/usePartnerApplications';

export type AppRole = 'admin' | 'staff' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole;
  isAdmin: boolean;
  isStaff: boolean;
  applicationStatus: ApplicationStatus | null;
  applicationRejectionReason: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole>('staff');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [applicationRejectionReason, setApplicationRejectionReason] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff' || userRole === 'user';

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchApplicationStatus(session.user.id);
          }, 0);
        } else {
          setUserRole('staff');
          setApplicationStatus(null);
          setApplicationRejectionReason(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchApplicationStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('staff');
        return;
      }

      const role = data?.role as AppRole;
      setUserRole(role === 'admin' ? 'admin' : role === 'user' ? 'user' : 'staff');
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('staff');
    }
  };

  const fetchApplicationStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('dairy_partner_applications')
        .select('status, rejection_reason')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching application status:', error);
        return;
      }

      if (data) {
        setApplicationStatus(data.status as ApplicationStatus);
        setApplicationRejectionReason(data.rejection_reason ?? null);
      } else {
        setApplicationStatus(null);
        setApplicationRejectionReason(null);
      }
    } catch (err) {
      console.error('Error fetching application status:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole('staff');
    setApplicationStatus(null);
    setApplicationRejectionReason(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      isAdmin, 
      isStaff,
      applicationStatus,
      applicationRejectionReason,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
