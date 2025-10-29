import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CertificatesPage() {
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [streamFilter, setStreamFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [streamResp, cohortResp] = await Promise.all([
          api.getStreams().catch(() => null),
          api.getCohorts().catch(() => null),
        ]);
        if (!mounted) return;
        setStreams((streamResp && streamResp.success && Array.isArray(streamResp.data)) ? streamResp.data : []);
        setCohorts((cohortResp && cohortResp.success && Array.isArray(cohortResp.data)) ? cohortResp.data : []);
      } catch (err) {
        console.error('Failed to load filter data', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const loadEligibleStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (streamFilter) params.stream_id = streamFilter;
      if (cohortFilter) params.cohort_id = cohortFilter;
      
      const resp = await api.getEligibleStudents(params);
      if (resp && resp.success) {
        // Handle either array or { items, total }
        if (Array.isArray(resp.data)) {
          setEligibleStudents(resp.data);
          setTotalEligible(resp.data.length);
        } else if (resp.data && Array.isArray(resp.data.items)) {
          setEligibleStudents(resp.data.items);
          setTotalEligible(typeof resp.data.total === 'number' ? resp.data.total : resp.data.items.length);
        } else {
          setEligibleStudents([]);
          setTotalEligible(0);
        }
      } else {
        setEligibleStudents([]);
        setTotalEligible(0);
        if (resp?.error) toast.error(resp.error);
      }
    } catch (err) {
      console.error('Failed to load eligible students', err);
      toast.error('Failed to load eligible students');
      setEligibleStudents([]);
      setTotalEligible(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEligibleStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamFilter, cohortFilter]);

  const handleDownloadCertificate = async (userId, studentName) => {
    try {
      toast.info(`Downloading certificate for ${studentName}...`);
      const resp = await api.downloadCertificate(userId, 'url');
      
      if (resp && resp.success) {
        // If the backend returns a URL or blob
        if (resp.data && resp.data.url) {
          // Open the certificate URL in a new tab
          window.open(resp.data.url, '_blank');
          toast.success('Certificate downloaded successfully');
          loadEligibleStudents(); // Reload to update download count
        } else if (resp.data && resp.data.certificate_data) {
          // If it returns base64 or file data
          const link = document.createElement('a');
          link.href = resp.data.certificate_data;
          link.download = `certificate_${userId}_${Date.now()}.pdf`;
          link.click();
          toast.success('Certificate downloaded successfully');
          loadEligibleStudents();
        } else {
          toast.success('Certificate download initiated');
          loadEligibleStudents();
        }
      } else {
        toast.error(resp?.error || 'Failed to download certificate');
      }
    } catch (err) {
      console.error('Failed to download certificate', err);
      toast.error('Failed to download certificate');
    }
  };

  const studentColumns = [
    {
      header: 'Name',
      render: (row) => row.full_name || row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—',
    },
    { 
      header: 'Email', 
      accessor: 'email',
      render: (row) => row.email || '—',
    },
    {
      header: 'Cohort',
      render: (row) => row.cohort_name || '—',
    },
    {
      header: 'Stream',
      render: (row) => row.stream_title || '—',
    },
    {
      header: 'Progress',
      render: (row) => {
        const progress = row.progress_percent !== undefined ? row.progress_percent : 0;
        return (
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{progress}%</span>
          </div>
        );
      },
    },
    {
      header: 'Attendance',
      render: (row) => {
        const attendance =
          typeof row.attendance_percentage === 'number'
            ? Math.round(row.attendance_percentage)
            : (row.attendance_rate !== undefined
                ? Math.round(row.attendance_rate * 100)
                : 0);
        return <span className="text-sm">{attendance}%</span>;
      },
    },
    {
      header: 'Download Count',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.download_count || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadCertificate(row.user_id, row.full_name || row.display_name || 'Student');
          }}
          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </button>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Certificates">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Certificate Eligible Students</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Students who have completed requirements and are eligible for certificates
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 text-primary-800">
                  Total Eligible: {eligibleStudents.length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={streamFilter}
                onChange={(e) => { setStreamFilter(e.target.value); setCohortFilter(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Streams</option>
                {streams.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                disabled={!streamFilter}
              >
                <option value="">All Cohorts</option>
                {cohorts
                  .filter(c => streamFilter ? c.stream_id === parseInt(streamFilter, 10) : true)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.cohort_name}</option>
                  ))}
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading eligible students...</p>
            </div>
          ) : eligibleStudents.length === 0 ? (
            <div className="p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No eligible students</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students are currently eligible for certificates with the selected filters.
              </p>
            </div>
          ) : (
            <DataTable columns={studentColumns} data={eligibleStudents} />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
