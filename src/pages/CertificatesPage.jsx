import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import LabeledInput from '../components/ui/LabeledInput';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ user_id: '', enrollment_id: '' });
  

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await api.getCertificates();
        if (!mounted) return;
        setCertificates((resp && resp.success && Array.isArray(resp.data)) ? resp.data : []);
      } catch (err) {
        console.error('Failed to load certificates', err);
        toast.error('Failed to load certificates');
      } finally {
        // no-op
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleIssueCertificate = () => {
    (async () => {
      try {
        const payload = {
          user_id: parseInt(issueForm.user_id, 10),
          enrollment_id: parseInt(issueForm.enrollment_id, 10),
        };
        if (!payload.user_id || !payload.enrollment_id) {
          toast.error('User ID and Enrollment ID are required');
          return;
        }
        const resp = await api.issueCertificate(payload);
        if (resp && resp.success) {
          const cResp = await api.getCertificates();
          setCertificates((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
          setShowIssueModal(false);
          setIssueForm({ user_id: '', enrollment_id: '' });
          toast.success('Certificate issued');
        } else {
          console.error('Issue certificate failed', resp && resp.error);
          toast.error(resp?.error || 'Failed to issue certificate');
        }
      } catch (err) {
        console.error('Issue certificate error', err);
        toast.error('Failed to issue certificate: ' + (err.message || 'Unknown error'));
      }
    })();
  };

  const handleRevoke = async (row) => {
    try {
      const resp = await api.revokeCertificate(row.id);
      if (resp && resp.success) {
        const cResp = await api.getCertificates();
        setCertificates((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
        toast.success('Certificate revoked');
      } else {
        toast.error(resp?.error || 'Failed to revoke certificate');
      }
    } catch (err) {
      toast.error('Failed to revoke certificate');
    }
  };

  const handleDelete = async (row) => {
    try {
      const resp = await api.deleteCertificate(row.id);
      if (resp && resp.success) {
        const cResp = await api.getCertificates();
        setCertificates((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
        toast.success('Certificate deleted');
      } else {
        toast.error(resp?.error || 'Failed to delete certificate');
      }
    } catch (err) {
      toast.error('Failed to delete certificate');
    }
  };

  const certificateColumns = [
    {
      header: 'Certificate #',
      accessor: 'certificate_number',
    },
    {
      header: 'Issued Date',
      render: (row) => row.issued_date ? new Date(row.issued_date).toLocaleDateString('en-NG') : '—',
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Download',
      render: (row) => row.download_url ? (
        <a href={row.download_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">PDF</a>
      ) : '—',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); setShowIssueModal(true); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Issue</button>
          {row.status === 'issued' && (
            <>
              {row.download_url && (
                <a href={row.download_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View</a>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleRevoke(row); }} className="text-sm text-red-600 hover:text-red-700 font-medium">Revoke</button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="text-sm text-gray-600 hover:text-gray-700 font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Certificates">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Certificate Management</h3>
            <p className="text-sm text-gray-600 mt-1">Track eligibility and issue certificates to qualified students</p>
          </div>
          <DataTable columns={certificateColumns} data={certificates} />
        </Card>

        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Issue Certificate"
        >
          <div className="space-y-4">
            <LabeledInput
              label="User ID"
              value={issueForm.user_id}
              onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}
              placeholder="10"
              required
            />
            <LabeledInput
              label="Enrollment ID"
              value={issueForm.enrollment_id}
              onChange={(e) => setIssueForm({ ...issueForm, enrollment_id: e.target.value })}
              placeholder="2"
              required
            />
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
              <button onClick={handleIssueCertificate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">Issue Certificate</button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
