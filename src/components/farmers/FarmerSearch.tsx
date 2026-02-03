import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FarmerSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FarmerSearch({ value, onChange, className }: FarmerSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by name or ID..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
