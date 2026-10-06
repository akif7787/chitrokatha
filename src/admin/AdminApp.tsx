import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardView } from './components/views/DashboardView';
import { MoviesView } from './components/views/MoviesView';
import { DramaView } from './components/views/DramaView';
import { WebSeriesView } from './components/views/WebSeriesView';
import { ActorsView } from './components/views/ActorsView';
import { GenresView } from './components/views/GenresView';
import { UsersView } from './components/views/UsersView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { PaymentsView } from './components/views/PaymentsView';
import { AdsView } from './components/views/AdsView';
import { NotificationsView } from './components/views/NotificationsView';
import { CouponsView } from './components/views/CouponsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { SupportView } from './components/views/SupportView';
import { AdminsView } from './components/views/AdminsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { AdminGuard } from './components/auth/AdminGuard';
import { AuthProvider } from '../context/AuthContext';

const AdminRouteRenderer: React.FC = () => {
  const { currentRoute } = useAdmin();

  switch (currentRoute) {
    case '/admin':
      return <DashboardView />;
    case '/admin/movies':
      return <MoviesView />;
    case '/admin/drama':
      return <DramaView />;
    case '/admin/web-series':
      return <WebSeriesView />;
    case '/admin/actors':
      return <ActorsView />;
    case '/admin/genres':
      return <GenresView />;
    case '/admin/users':
      return <UsersView />;
    case '/admin/subscriptions':
      return <SubscriptionsView />;
    case '/admin/payments':
      return <PaymentsView />;
    case '/admin/ads':
      return <AdsView />;
    case '/admin/notifications':
      return <NotificationsView />;
    case '/admin/coupons':
      return <CouponsView />;
    case '/admin/analytics':
      return <AnalyticsView />;
    case '/admin/settings':
      return <SettingsView />;
    case '/admin/support':
      return <SupportView />;
    case '/admin/admins':
      return <AdminsView />;
    case '/admin/audit-logs':
      return <AuditLogsView />;
    default:
      return <DashboardView />;
  }
};

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminGuard>
        <AdminProvider>
          <AdminLayout>
            <AdminRouteRenderer />
          </AdminLayout>
        </AdminProvider>
      </AdminGuard>
    </AuthProvider>
  );
}
