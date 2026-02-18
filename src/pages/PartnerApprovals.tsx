import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useAllApplications,
  useApproveApplication,
  useRejectApplication,
} from '@/hooks/usePartnerApplications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import type { PartnerApplication } from '@/hooks/usePartnerApplications';

function ApplicationCard({
  application,
  onApprove,
  onReject,
}: {
  application: PartnerApplication;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
              {application.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{application.full_name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(application.created_at), 'dd MMM yyyy, h:mm a')}
              </div>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {application.contact_number}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {application.email}
          </div>
        </div>

        {application.rejection_reason && (
          <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
            <p className="text-xs font-medium text-destructive">Rejection reason:</p>
            <p className="text-xs text-muted-foreground mt-0.5">{application.rejection_reason}</p>
          </div>
        )}

        {onApprove && onReject && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={onApprove}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onReject}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: PartnerApplication['status'] }) {
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  }
  if (status === 'approved') {
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
        <CheckCircle className="mr-1 h-3 w-3" />
        Approved
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
      <XCircle className="mr-1 h-3 w-3" />
      Rejected
    </Badge>
  );
}

function ApplicationList({
  status,
  onApprove,
  onReject,
}: {
  status: 'pending' | 'approved' | 'rejected';
  onApprove?: (app: PartnerApplication) => void;
  onReject?: (app: PartnerApplication) => void;
}) {
  const { data: applications, isLoading } = useAllApplications(status);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">No {status} applications</p>
        <p className="text-sm text-muted-foreground mt-1">
          {status === 'pending'
            ? 'New partner sign-ups will appear here for review.'
            : `No applications have been ${status} yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          application={app}
          onApprove={onApprove ? () => onApprove(app) : undefined}
          onReject={onReject ? () => onReject(app) : undefined}
        />
      ))}
    </div>
  );
}

export default function PartnerApprovals() {
  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (app: PartnerApplication) => {
    approveApp.mutate({ applicationId: app.id, userId: app.user_id });
  };

  const handleRejectClick = (app: PartnerApplication) => {
    setSelectedApp(app);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedApp) return;
    rejectApp.mutate(
      { applicationId: selectedApp.id, rejectionReason },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setSelectedApp(null);
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="shadow-dairy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Partner Approvals
            </CardTitle>
            <CardDescription>
              Review and manage collection partner applications
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ApplicationList
              status="pending"
              onApprove={handleApprove}
              onReject={handleRejectClick}
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            <ApplicationList status="approved" />
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <ApplicationList status="rejected" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedApp?.full_name}'s application. This will be shown to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Reason (optional)</Label>
            <Textarea
              id="rejectionReason"
              placeholder="e.g. Area not currently covered, documentation incomplete..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectApp.isPending}
            >
              {rejectApp.isPending ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
