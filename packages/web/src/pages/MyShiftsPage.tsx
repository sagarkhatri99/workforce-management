import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format } from 'date-fns';

export const MyShiftsPage = () => {
  const queryClient = useQueryClient();

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: async () => {
      const { data } = await api.get('/shifts?myShifts=true');
      return data;
    }
  });

  const clockMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'IN' | 'OUT' }) => {
      await api.post(`/clock/${id}`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      alert('Clock event recorded!');
    },
    onError: (err: any) => {
        alert(err.response?.data?.message || 'Error clocking');
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">My Shifts</h2>
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
                <p><strong>Status:</strong> {shift.status}</p>

                <div className="flex gap-2 mt-4">
                  {shift.status === 'CLAIMED' && (
                      <>
                        <Button
                            variant="primary"
                            onClick={() => clockMutation.mutate({ id: shift.id, type: 'IN' })}
                            isLoading={clockMutation.isPending}
                        >
                            Clock In
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => clockMutation.mutate({ id: shift.id, type: 'OUT' })}
                            isLoading={clockMutation.isPending}
                        >
                            Clock Out
                        </Button>
                      </>
                  )}
                  {shift.status === 'COMPLETED' && (
                      <p className="text-green-600 font-bold">Shift Completed</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
