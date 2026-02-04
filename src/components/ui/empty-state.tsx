import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'muted' | 'card';
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg p-8 text-center',
        variant === 'muted' && 'bg-muted',
        variant === 'card' && 'border bg-card shadow-dairy',
        className
      )}
    >
      <div className="rounded-full bg-secondary p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      
      {children}
      
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface NoSearchResultsProps {
  query: string;
  onClear?: () => void;
}

export function NoSearchResults({ query, onClear }: NoSearchResultsProps) {
  return (
    <div className="rounded-lg bg-muted p-6 text-center">
      <p className="font-medium text-foreground">No results found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No matches for "{query}"
      </p>
      {onClear && (
        <Button variant="link" size="sm" className="mt-2" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}
