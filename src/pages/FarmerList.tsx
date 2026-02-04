import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FarmerCard } from '@/components/farmers/FarmerCard';
import { FarmerSearch } from '@/components/farmers/FarmerSearch';
import { FarmerFilter, FilterStatus } from '@/components/farmers/FarmerFilter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarmers } from '@/hooks/useFarmers';
import { useCenter } from '@/contexts/CenterContext';
import { Plus, Users } from 'lucide-react';

export default function FarmerList() {
  const navigate = useNavigate();
  const { selectedCenter } = useCenter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { data: farmers, isLoading, error } = useFarmers(selectedCenter?.id);

  const filteredFarmers = useMemo(() => {
    if (!farmers) return [];

    return farmers.filter((farmer) => {
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        farmer.full_name.toLowerCase().includes(searchLower) ||
        farmer.farmer_code.toLowerCase().includes(searchLower) ||
        farmer.phone?.toLowerCase().includes(searchLower);

      // Filter by status
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && farmer.is_active) ||
        (filterStatus === 'inactive' && !farmer.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [farmers, searchQuery, filterStatus]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Farmers
          </h1>
          <span className="text-sm text-muted-foreground">
            {filteredFarmers.length} {filteredFarmers.length === 1 ? 'farmer' : 'farmers'}
          </span>
        </div>

        {/* Search & Filter */}
        <div className="mb-4 space-y-3">
          <FarmerSearch value={searchQuery} onChange={setSearchQuery} />
          <FarmerFilter value={filterStatus} onChange={setFilterStatus} />
        </div>

        {/* Farmer List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
              Failed to load farmers. Please try again.
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="rounded-lg bg-muted p-8 text-center">
              <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-foreground">No farmers found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add your first farmer to get started'}
              </p>
            </div>
          ) : (
            filteredFarmers.map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
                onClick={() => navigate(`/farmers/${farmer.id}`)}
              />
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full p-0 shadow-lg"
          onClick={() => navigate('/farmers/add')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
