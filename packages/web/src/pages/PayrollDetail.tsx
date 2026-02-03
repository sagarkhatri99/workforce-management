import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPeriodReport, generatePayroll, downloadPayrollCsv, PayrollReport } from '../lib/payroll.service';

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PayrollReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) loadReport(id);
  }, [id]);

  const loadReport = async (periodId: string) => {
    try {
      const data = await getPeriodReport(periodId);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await generatePayroll(id);
      await loadReport(id);
      alert('Payroll generated successfully');
    } catch (e) {
      alert('Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
        await downloadPayrollCsv(id);
    } catch (e) {
        alert('Failed to download CSV');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!report) return <div className="p-6">Report not found</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <Link to="/payroll" className="text-sm text-blue-600 hover:underline mb-1 inline-block">&larr; Back to Periods</Link>
           <h1 className="text-2xl font-bold">Payroll Report: {report.period.month}/{report.period.year}</h1>
        </div>
        <div className="space-x-4">
            <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
                {generating ? 'Generating...' : 'Calculate Payroll'}
            </button>
            <button
                onClick={handleDownload}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
                Export CSV
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Total Gross Pay</h3>
            <p className="text-2xl font-bold">${report.totals.totalGrossPay.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Total Hours</h3>
            <p className="text-2xl font-bold">{report.totals.totalRegularHours + report.totals.totalOvertimeHours}</p>
            <p className="text-xs text-gray-500">Reg: {report.totals.totalRegularHours.toFixed(1)} | OT: {report.totals.totalOvertimeHours.toFixed(1)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Employees</h3>
            <p className="text-2xl font-bold">{report.totals.totalEmployees}</p>
        </div>
         <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Anomalies</h3>
            <p className={`text-2xl font-bold ${report.totals.employeesWithAnomalies > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {report.totals.employeesWithAnomalies}
            </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shifts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.summaries.map((s, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{s.userName}</div>
                  <div className="text-sm text-gray-500">{s.userEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {s.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {s.totalHours.toFixed(2)} <span className="text-xs text-gray-500">(OT: {s.overtimeHours.toFixed(2)})</span>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  ${s.grossPay.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {s.shiftCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {s.hasAnomalies ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {s.anomalyCount} Issue(s)
                      </span>
                  ) : (
                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          OK
                      </span>
                  )}
                </td>
              </tr>
            ))}
            {report.summaries.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No data. Click "Calculate Payroll" to generate.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
