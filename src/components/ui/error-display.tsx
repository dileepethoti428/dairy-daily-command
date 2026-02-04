import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'inline' | 'card' | 'fullscreen';
  className?: string;
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message,
  onRetry,
  variant = 'inline',
  className,
}: ErrorDisplayProps) {
  const isNetworkError = message.toLowerCase().includes('network') || 
                         message.toLowerCase().includes('fetch') ||
                         message.toLowerCase().includes('connection');

  const Icon = isNetworkError ? WifiOff : AlertCircle;

  if (variant === 'card') {
    return (
      <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Icon className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8', className)}>
        <Icon className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className={cn('rounded-lg bg-destructive/10 p-4 text-center', className)}>
      <div className="flex items-center justify-center gap-2 text-destructive">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <Button variant="link" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Human-readable error message transformer
export function getReadableErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  
  const message = error instanceof Error ? error.message : String(error);
  
  // Common error transformations
  const errorMap: Record<string, string> = {
    'Failed to fetch': 'Network issue. Please check your connection and try again.',
    'NetworkError': 'Unable to connect. Please check your internet connection.',
    '23505': 'This record already exists.',
    'PGRST301': 'You do not have permission to perform this action.',
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please verify your email before signing in.',
    'User already registered': 'An account with this email already exists.',
  };

  for (const [key, readable] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return readable;
    }
  }

  // Clean up technical messages
  if (message.includes('violates foreign key constraint')) {
    return 'This action cannot be completed because it references other data.';
  }
  
  if (message.includes('violates unique constraint')) {
    return 'This record already exists. Duplicates are not allowed.';
  }

  if (message.includes('violates check constraint')) {
    return 'The provided values are not valid.';
  }

  return message;
}
