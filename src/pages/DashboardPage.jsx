import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../utils/api';
import StatusPill from '../components/ui/StatusBadge';

export default function DashboardPage() {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [streams, setStreams] = useState([]);
  const [recentCohorts, setRecentCohorts] = useState([]);
  const [stats, setStats] = useState({
    activeCohorts: 0,
    activeStreams: 0,
    totalStreams: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [cohResp, strResp, studResp] = await Promise.all([
          api.getCohorts().catch(() => null),
          api.getStreams().catch(() => null),
          api.getStudents().catch(() => null),
        ]);

        const cohortsData = (cohResp && cohResp.success && Array.isArray(cohResp.data)) ? cohResp.data : [];
        const streamsData = (strResp && strResp.success && Array.isArray(strResp.data)) ? strResp.data : [];
        const studentsData = (studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : [];

        setStreams(streamsData);

        const activeCohorts = cohortsData.filter(c => ['ongoing','upcoming'].includes((c.status || '').toLowerCase()));
        const activeStreams = streamsData.filter(s => s.is_active !== false).length;

        setStats({
          activeCohorts: activeCohorts.length,
          activeStreams,
          totalStreams: streamsData.length,
          totalStudents: studentsData.length,
        });

        // Recent cohorts by most recent start_date (or id)
        const sortedCohorts = [...cohortsData].sort((a,b) => {
          const ad = a.start_date ? new Date(a.start_date).getTime() : 0;
          const bd = b.start_date ? new Date(b.start_date).getTime() : 0;
          return bd - ad;
        });
        setRecentCohorts(sortedCohorts.slice(0,5));

        // Placeholder: clear sessions and alerts for now, or keep empty
        setUpcomingSessions([]);
        setAlerts([]);
      } catch (err) {
        // On error, clear stats/upcoming and surface minimal alerts
        console.error('Dashboard load error:', err);
        setStats({
          activeCohorts: 0,
          activeStreams: 0,
          totalStreams: 0,
          totalStudents: 0,
        });
        setUpcomingSessions([]);
        setAlerts([{ id: 1, message: 'Failed to load dashboard data.', type: 'warning' }]);
      }
    }

    load();
  }, []);

  const sessionColumns = [
    {
      header: 'Date & Time',
      render: (row) => {
        const date = new Date(row.date);
        return (
          <div>
            <p className="font-medium">
              {date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500">
              {date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} WAT
            </p>
          </div>
        );
      },
    },
    {
      header: 'Topic',
      accessor: 'topic',
    },
    {
      header: 'Cohort',
      render: (row) => (
        <div>
          <p className="font-medium">{row.cohort}</p>
          <p className="text-xs text-gray-500">{row.stream}</p>
        </div>
      ),
    },
    {
      header: 'Instructor',
      accessor: 'instructor',
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const recentCohortColumns = [
    {
      header: 'Cohort',
      render: (row) => (
        <div>
          <p className="font-medium">{row.cohort_name}</p>
          <p className="text-xs text-gray-500">{row.stream_title || (streams.find(s => s.id === row.stream_id)?.title) || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Start Date',
      render: (row) => (
        <span>{row.start_date ? new Date(row.start_date).toLocaleDateString('en-NG') : '—'}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
  ];

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Cohorts"
            value={stats.activeCohorts}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            title="Active Streams"
            value={stats.activeStreams}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            }
          />
          <StatCard
            title="Total Streams"
            value={stats.totalStreams}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>

        {upcomingSessions.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
            </div>
            <DataTable columns={sessionColumns} data={upcomingSessions} />
          </Card>
        )}

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Cohorts</h3>
          </div>
          <DataTable columns={recentCohortColumns} data={recentCohorts} />
        </Card>

        {alerts.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            </div>
            <div className="p-6 space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
