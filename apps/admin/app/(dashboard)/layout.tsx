import { AuthGuard } from '@/components/auth-guard';
import { AdminHeader } from '@/components/admin-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        {children}
      </div>
    </AuthGuard>
  );
}
