import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterStatus = 'all' | 'active' | 'inactive';

interface FarmerFilterProps {
  value: FilterStatus;
  onChange: (value: FilterStatus) => void;
}

export function FarmerFilter({ value, onChange }: FarmerFilterProps) {
  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(filter.value)}
          className={cn(
            'flex-1',
            value === filter.value && 'shadow-sm'
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
