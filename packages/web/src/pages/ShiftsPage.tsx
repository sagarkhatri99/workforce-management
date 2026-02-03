import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';

export const ShiftsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data } = await api.get('/shifts');
      return data;
    }
  });

  const claimMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/shifts/${id}/claim`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newShift: any) => {
      await api.post('/shifts', newShift);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowCreate(false);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Shifts</h2>
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'Create Shift'}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Create New Shift</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    createMutation.mutate({
                        title: fd.get('title'),
                        startTime: new Date(fd.get('startTime') as string).toISOString(),
                        endTime: new Date(fd.get('endTime') as string).toISOString(),
                        location: fd.get('location'),
                        skills: (fd.get('skills') as string).split(',').map(s => s.trim())
                    });
                }} className="space-y-4">
                    <Input name="title" label="Title" required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="startTime" type="datetime-local" label="Start Time" required />
                        <Input name="endTime" type="datetime-local" label="End Time" required />
                    </div>
                    <Input name="location" label="Location" />
                    <Input name="skills" label="Skills (comma separated)" placeholder="Forklift, Driver" />
                    <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
                </form>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shifts?.map((shift: any) => (
          <Card key={shift.id}>
            <CardHeader>
              <CardTitle>{shift.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p><strong>Time:</strong> {format(new Date(shift.startTime), 'PP p')} - {format(new Date(shift.endTime), 'p')}</p>
                <p><strong>Location:</strong> {shift.location}</p>
                <p><strong>Skills:</strong> {shift.skills.join(', ')}</p>
                <p><strong>Status:</strong> {shift.status}</p>
                {shift.worker && <p><strong>Worker:</strong> {shift.worker.name}</p>}

                {user?.role === 'WORKER' && shift.status === 'OPEN' && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => claimMutation.mutate(shift.id)}
                    isLoading={claimMutation.isPending}
                  >
                    Claim Shift
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
