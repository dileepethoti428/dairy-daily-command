import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Milk, LogOut, User, Settings, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const { selectedCenter, setSelectedCenter, centers, isLoading: centersLoading, canSwitchCenters } = useCenter();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const handleCenterChange = (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    if (center) {
      setSelectedCenter(center);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card safe-top">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Logo/App Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Milk className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold text-foreground sm:inline">
            MilkPro
          </span>
        </div>

        {/* Center Selector */}
        {centersLoading ? (
          <Skeleton className="h-9 w-[140px]" />
        ) : canSwitchCenters && centers.length > 0 ? (
          // Admin: Can switch centers
          <Select 
            value={selectedCenter?.id || ''} 
            onValueChange={handleCenterChange}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px] max-w-[180px] border-none bg-secondary text-sm font-medium">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select Center" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  <div className="flex items-center gap-2">
                    <span>{center.name}</span>
                    {!center.is_active && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : selectedCenter ? (
          // Staff: Show assigned center (static)
          <div className="flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[120px] truncate">{selectedCenter.name}</span>
          </div>
        ) : null}

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/system-settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/centers')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Collection Centers
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
