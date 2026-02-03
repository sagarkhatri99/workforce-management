import React, { useState, useEffect } from 'react';
import { getPeriods, createPeriod, PayrollPeriod } from '../lib/payroll.service';
import { Link } from 'react-router-dom';

export default function Payroll() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const data = await getPeriods();
      setPeriods(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createPeriod(newMonth, newYear);
      await loadPeriods();
    } catch (e) {
      alert('Failed to create period. It might already exist.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payroll Management</h1>

      {/* Create Form */}
      <div className="bg-white p-4 rounded shadow mb-6 max-w-lg">
        <h2 className="font-semibold mb-4">Create New Period</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-700">Month</label>
            <input
              type="number" min="1" max="12"
              value={newMonth} onChange={e => setNewMonth(parseInt(e.target.value))}
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Year</label>
            <input
              type="number" min="2020" max="2100"
              value={newYear} onChange={e => setNewYear(parseInt(e.target.value))}
              className="border p-2 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.map(period => (
              <tr key={period.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {period.month}/{period.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${period.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {period.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/payroll/${period.id}`} className="text-blue-600 hover:text-blue-900">View Report</Link>
                </td>
              </tr>
            ))}
            {periods.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No periods found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
