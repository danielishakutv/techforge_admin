import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';

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
      toast.info(`Generating certificate for ${studentName}...`);
      
      // Fetch certificate data from backend
      const resp = await api.getCertificateData(userId);
      
      if (!resp || !resp.success || !resp.data) {
        toast.error(resp?.error || 'Failed to fetch certificate data');
        return;
      }

      const certData = resp.data;
      
      // Generate PDF certificate
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background border
      doc.setDrawColor(59, 130, 246); // primary-600
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      // Add logo if available
      if (certData.logo_url) {
        try {
          // Note: Cross-origin images may require CORS or proxy
          // For now, we'll show logo URL as text or skip
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text('Logo: Toko Academy', pageWidth / 2, 25, { align: 'center' });
        } catch (e) {
          console.warn('Logo load failed', e);
        }
      }

      // Certificate title
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 50, { align: 'center' });

      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('This is to certify that', pageWidth / 2, 65, { align: 'center' });

      // Student name
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(certData.student_name, pageWidth / 2, 80, { align: 'center' });

      // Achievement text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('has successfully completed the', pageWidth / 2, 95, { align: 'center' });

      // Stream title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(certData.stream_title, pageWidth / 2, 108, { align: 'center' });

      // Cohort and description
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`${certData.cohort_name}`, pageWidth / 2, 118, { align: 'center' });
      
      if (certData.stream_description) {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(certData.stream_description, pageWidth / 2, 128, { align: 'center' });
      }

      // Issue date
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Issued on: ${new Date(certData.issued_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, 145, { align: 'center' });

      // Certificate number
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Certificate No: ${certData.certificate_number}`, pageWidth / 2, 155, { align: 'center' });

      // Signature section
      const sigY = pageHeight - 40;
      doc.setLineWidth(0.5);
      doc.setDrawColor(150);
      doc.line(40, sigY, 90, sigY);
      doc.line(pageWidth - 90, sigY, pageWidth - 40, sigY);

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text('Director', 65, sigY + 7, { align: 'center' });
      doc.text('Toko Academy', pageWidth - 65, sigY + 7, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Toko Academy Bootcamp Program', pageWidth / 2, pageHeight - 15, { align: 'center' });

      // Save PDF
      doc.save(`Certificate_${certData.student_name.replace(/\s+/g, '_')}_${certData.certificate_number}.pdf`);
      
      toast.success('Certificate downloaded successfully');

      // Silently increment download count
      try {
        await api.incrementDownload(certData.certificate_id);
        // Reload students to update download count display
        loadEligibleStudents();
      } catch (err) {
        console.error('Failed to increment download count', err);
        // Don't show error to user, just log it
      }
      
    } catch (err) {
      console.error('Failed to download certificate', err);
      toast.error('Failed to generate certificate');
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
