import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  Shield, 
  Building2, 
  Cog,
  Bell,
  Moon,
  Sun,
  Smartphone,
  HelpCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Settings() {
  const { user, userRole, isAdmin, signOut } = useAuth();
  const { selectedCenter } = useCenter();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Local state for settings that don't persist to DB
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotifications(enabled);
    toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toast.success(enabled ? 'Sound alerts enabled' : 'Sound alerts disabled');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Profile Card */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      {userRole || 'user'}
                    </Badge>
                    {selectedCenter && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="mr-1 h-3 w-3" />
                        {selectedCenter.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Use dark theme</p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>

            <Separator />

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="notifications" className="font-medium">Notifications</Label>
                  <p className="text-xs text-muted-foreground">Enable app notifications</p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

            <Separator />

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sound" className="font-medium">Sound Alerts</Label>
                  <p className="text-xs text-muted-foreground">Play sounds for actions</p>
                </div>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Collection Reports</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <button
              className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80"
              onClick={() => navigate('/farmers')}
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Manage Farmers</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80"
              onClick={() => toast.info('Help center coming soon!')}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Help & Support</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Separator />
            <Card className="shadow-dairy border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Administration
                </CardTitle>
                <CardDescription>
                  Admin-only settings and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/system-settings')}
                >
                  <Cog className="mr-3 h-5 w-5" />
                  System Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/centers')}
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  Collection Centers
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* App Info */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            Milk Procurement System v1.0.0
          </p>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="h-12 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
