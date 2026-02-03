import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Milk, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dummy collection centers for now
const dummyCenters = [
  { id: '1', name: 'Main Center', code: 'MC001' },
  { id: '2', name: 'North Branch', code: 'NB002' },
  { id: '3', name: 'South Branch', code: 'SB003' },
];

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedCenter, setSelectedCenter] = useState(dummyCenters[0].id);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
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
        <Select value={selectedCenter} onValueChange={setSelectedCenter}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] border-none bg-secondary text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dummyCenters.map((center) => (
              <SelectItem key={center.id} value={center.id}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
