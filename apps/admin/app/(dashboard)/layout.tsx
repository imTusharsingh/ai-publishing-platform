import { AuthGuard } from '@/components/auth-guard';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        {children}
      </div>
    </AuthGuard>
  );
}
