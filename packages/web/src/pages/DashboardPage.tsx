import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Calendar, CheckCircle, Clock } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user?.role !== 'WORKER' ? (
          <>
            <StatsCard title="Total Shifts" value={stats.totalShifts} icon={<Calendar className="h-4 w-4 text-gray-500" />} />
            <StatsCard title="Open Shifts" value={stats.openShifts} icon={<Clock className="h-4 w-4 text-gray-500" />} />
            <StatsCard title="Claimed Shifts" value={stats.claimedShifts} icon={<CheckCircle className="h-4 w-4 text-gray-500" />} />
            <StatsCard title="Fill Rate" value={`${stats.fillRate}%`} icon={<Users className="h-4 w-4 text-gray-500" />} />
          </>
        ) : (
          <>
            <StatsCard title="My Shifts" value={stats.myShifts} icon={<Calendar className="h-4 w-4 text-gray-500" />} />
            <StatsCard title="Completed" value={stats.completed} icon={<CheckCircle className="h-4 w-4 text-gray-500" />} />
          </>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
