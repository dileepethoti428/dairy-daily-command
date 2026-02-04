import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CollectionCenter = Database['public']['Tables']['collection_centers']['Row'];

interface CenterContextType {
  selectedCenter: CollectionCenter | null;
  setSelectedCenter: (center: CollectionCenter | null) => void;
  centers: CollectionCenter[];
  isLoading: boolean;
  userAssignedCenter: CollectionCenter | null;
  canSwitchCenters: boolean;
}

const CenterContext = createContext<CenterContextType | undefined>(undefined);

export function CenterProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [selectedCenter, setSelectedCenter] = useState<CollectionCenter | null>(null);
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [userAssignedCenter, setUserAssignedCenter] = useState<CollectionCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all centers (for admin) or assigned center (for staff)
  useEffect(() => {
    async function fetchCenters() {
      if (!user) {
        setCenters([]);
        setSelectedCenter(null);
        setUserAssignedCenter(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch all active centers
        const { data: allCenters, error: centersError } = await supabase
          .from('collection_centers')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (centersError) throw centersError;
        setCenters(allCenters || []);

        // Fetch user's assigned center
        const { data: assignment, error: assignmentError } = await supabase
          .from('user_center_assignments')
          .select(`
            center_id,
            is_primary,
            collection_centers (*)
          `)
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (assignmentError) {
          console.error('Error fetching center assignment:', assignmentError);
        }

        const assignedCenter = assignment?.collection_centers as CollectionCenter | null;
        setUserAssignedCenter(assignedCenter);

        // Set selected center based on role
        if (isAdmin) {
          // Admin: Use stored preference or first center
          const storedCenterId = localStorage.getItem('selectedCenterId');
          const storedCenter = allCenters?.find(c => c.id === storedCenterId);
          setSelectedCenter(storedCenter || allCenters?.[0] || null);
        } else {
          // Staff: Use assigned center only
          setSelectedCenter(assignedCenter);
        }
      } catch (error) {
        console.error('Error fetching centers:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCenters();
  }, [user, isAdmin]);

  // Save admin's center selection to localStorage
  const handleSetSelectedCenter = (center: CollectionCenter | null) => {
    if (isAdmin && center) {
      localStorage.setItem('selectedCenterId', center.id);
    }
    setSelectedCenter(center);
  };

  const canSwitchCenters = isAdmin;

  return (
    <CenterContext.Provider
      value={{
        selectedCenter,
        setSelectedCenter: handleSetSelectedCenter,
        centers,
        isLoading,
        userAssignedCenter,
        canSwitchCenters,
      }}
    >
      {children}
    </CenterContext.Provider>
  );
}

export function useCenter() {
  const context = useContext(CenterContext);
  if (context === undefined) {
    throw new Error('useCenter must be used within a CenterProvider');
  }
  return context;
}
