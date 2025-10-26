import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { cohorts as mockCohorts, sessions as mockSessions, assignments as mockAssignments } from '../data/mockData';
import api from '../utils/api';

export default function DashboardPage() {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    activeCohorts: 0,
    totalStudents: 0,
    avgAttendance: 0,
    assignmentsWaitingGrading: 0,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [cohortRes, sessionRes, assignmentRes] = await Promise.allSettled([
          api.getCohorts(),
          api.getSessions(),
          api.getAssignments(),
        ]);

        const cohorts = cohortRes.status === 'fulfilled' && cohortRes.value?.success ? cohortRes.value.data.items : mockCohorts;
        const sessions = sessionRes.status === 'fulfilled' && sessionRes.value?.success ? sessionRes.value.data.items : mockSessions;
        const assignments = assignmentRes.status === 'fulfilled' && assignmentRes.value?.success ? assignmentRes.value.data.items : mockAssignments;

        const activeCohorts = cohorts.filter(c => ['Ongoing', 'ongoing', 'Active', 'active', 'upcoming', 'Upcoming'].includes(c.status || c.cohort_name || ''));
        const totalStudents = cohorts.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);

        const ongoing = cohorts.filter(c => c.status === 'Ongoing' || c.status === 'ongoing' || c.status === 'Active' || c.status === 'active');
        const avgAttendance = ongoing.length > 0 ? (ongoing.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) / ongoing.length) : 0;

        const waitingGrading = (assignments || []).reduce((sum, a) => {
          const subs = a.submissions || [];
          return sum + subs.filter(s => (s.status || '').toLowerCase() === 'submitted').length;
        }, 0);

        if (!mounted) return;
        setStats({
          activeCohorts: activeCohorts.length,
          totalStudents,
          avgAttendance: Math.round(avgAttendance * 100),
          assignmentsWaitingGrading: waitingGrading,
        });

        const upcoming = (sessions || []).filter(s => new Date(s.date) >= new Date() && (s.status || '').toLowerCase() === 'scheduled')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingSessions(upcoming);

        setAlerts([
          {
            id: 1,
            message: 'Cohort 12 · Web Dev: Attendance dropped below 85% this week.',
            type: 'warning',
          },
          {
            id: 2,
            message: 'AI Essentials · Cohort 3: 5 submissions still ungraded.',
            type: 'info',
          },
        ]);
      } catch (err) {
        // fallback to mock data
        const activeCohorts = mockCohorts.filter(c => c.status === 'Ongoing' || c.status === 'Upcoming');
        const totalStudents = mockCohorts.reduce((sum, c) => sum + c.studentsEnrolled, 0);
        const avgAttendance = mockCohorts.filter(c => c.status === 'Ongoing').reduce((sum, c) => sum + c.attendanceRate, 0) / Math.max(1, mockCohorts.filter(c => c.status === 'Ongoing').length);
        const waitingGrading = mockAssignments.reduce((sum, a) => sum + a.submissions.filter(s => s.status === 'Submitted').length, 0);
        if (!mounted) return;
        setStats({
          activeCohorts: activeCohorts.length,
          totalStudents,
          avgAttendance: Math.round(avgAttendance * 100),
          assignmentsWaitingGrading: waitingGrading,
        });
        const upcoming = mockSessions.filter(s => new Date(s.date) >= new Date() && s.status === 'Scheduled').sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingSessions(upcoming);
        setAlerts([
          { id: 1, message: 'Cohort 12 · Web Dev: Attendance dropped below 85% this week.', type: 'warning' },
          { id: 2, message: 'AI Essentials · Cohort 3: 5 submissions still ungraded.', type: 'info' },
        ]);
      }
    };

    load();
    return () => { mounted = false; };
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
            title="Total Students Enrolled"
            value={stats.totalStudents}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Attendance Today"
            value={`${stats.avgAttendance}%`}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Assignments Waiting for Grading"
            value={stats.assignmentsWaitingGrading}
            icon={
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
          </div>
          <DataTable columns={sessionColumns} data={upcomingSessions} />
        </Card>

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
      </div>
    </AdminLayout>
  );
}
