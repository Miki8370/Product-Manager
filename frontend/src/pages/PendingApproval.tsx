import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PendingApproval = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="max-w-sm text-center animate-enter">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
        <Clock className="h-6 w-6 text-warning" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">Account Pending Approval</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account is awaiting administrator approval. You'll be able to sign in once approved.
      </p>
      <Link to="/login" className="mt-6 inline-block">
        <Button variant="outline">Back to Login</Button>
      </Link>
    </div>
  </div>
);

export default PendingApproval;
