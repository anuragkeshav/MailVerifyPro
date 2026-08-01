import { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Layout } from '@/components/layout/Layout';
import DashboardPage from '@/pages/DashboardPage';
import HistoryPage from '@/pages/HistoryPage';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [activePage, setActivePage] = useState<'dashboard' | 'history'>('dashboard');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout activePage={activePage} onPageChange={setActivePage}>
        {activePage === 'dashboard' ? <DashboardPage /> : <HistoryPage />}
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}
