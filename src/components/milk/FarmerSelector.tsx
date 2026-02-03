import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, AlertTriangle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFarmers } from '@/hooks/useFarmers';
import { Badge } from '@/components/ui/badge';

interface FarmerSelectorProps {
  value: string;
  onChange: (farmerId: string, farmer?: { full_name: string; farmer_code: string | null }) => void;
  disabled?: boolean;
  error?: string;
}

export function FarmerSelector({ value, onChange, disabled, error }: FarmerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  const [pendingFarmer, setPendingFarmer] = useState<{
    id: string;
    full_name: string;
    farmer_code: string | null;
  } | null>(null);

  const { data: farmers, isLoading } = useFarmers();

  const selectedFarmer = useMemo(() => {
    return farmers?.find((f) => f.id === value);
  }, [farmers, value]);

  const handleSelect = (farmer: NonNullable<typeof farmers>[number]) => {
    if (!farmer.is_active) {
      setPendingFarmer({
        id: farmer.id,
        full_name: farmer.full_name,
        farmer_code: farmer.farmer_code,
      });
      setShowInactiveWarning(true);
    } else {
      onChange(farmer.id, {
        full_name: farmer.full_name,
        farmer_code: farmer.farmer_code,
      });
      setOpen(false);
    }
  };

  const confirmInactiveFarmer = () => {
    if (pendingFarmer) {
      onChange(pendingFarmer.id, {
        full_name: pendingFarmer.full_name,
        farmer_code: pendingFarmer.farmer_code,
      });
    }
    setShowInactiveWarning(false);
    setPendingFarmer(null);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-14 w-full justify-between text-base',
              !value && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            {selectedFarmer ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">{selectedFarmer.full_name}</span>
                <span className="text-sm text-muted-foreground">
                  ({selectedFarmer.farmer_code})
                </span>
                {!selectedFarmer.is_active && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search farmer...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name or ID..." className="h-12" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : 'No farmer found.'}
              </CommandEmpty>
              <CommandGroup>
                {farmers?.map((farmer) => (
                  <CommandItem
                    key={farmer.id}
                    value={`${farmer.full_name} ${farmer.farmer_code || ''}`}
                    onSelect={() => handleSelect(farmer)}
                    className={cn(
                      'py-3',
                      !farmer.is_active && 'opacity-60'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === farmer.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-medium">{farmer.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {farmer.farmer_code} • {farmer.village || 'N/A'}
                        </p>
                      </div>
                      {!farmer.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showInactiveWarning} onOpenChange={setShowInactiveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Inactive Farmer Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingFarmer?.full_name}</strong> is marked as inactive.
              Are you sure you want to add a milk entry for this farmer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFarmer(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmInactiveFarmer}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
