import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [streams, setStreams] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [selectedStreamId, setSelectedStreamId] = useState('');
  // Listing filters
  const [filterStreamId, setFilterStreamId] = useState('');
  const [filterCohortId, setFilterCohortId] = useState('');

  const [newSession, setNewSession] = useState({
    cohort_id: '',
    title: '',
    delivery_mode: 'online',
    start_datetime: '',
    end_datetime: '',
    instructor_id: '',
  });

  // Helper: fetch sessions for a given cohort id
  const fetchSessionsByCohort = async (cohortId) => {
    if (!cohortId) return;
    try {
      const sResp = await api.getSessions({ cohort_id: cohortId });
      setSessions((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
    } catch (err) {
      toast.error('Failed to load sessions');
    }
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          cohort_id: parseInt(newSession.cohort_id, 10),
          title: newSession.title,
          delivery_mode: newSession.delivery_mode,
          start_datetime: newSession.start_datetime,
          end_datetime: newSession.end_datetime,
          instructor_id: parseInt(newSession.instructor_id, 10),
        };
        const resp = await api.createSession(payload);
        if (resp && resp.success) {
          await fetchSessionsByCohort(payload.cohort_id);
          setShowCreateModal(false);
          setNewSession({ cohort_id: '', title: '', delivery_mode: 'online', start_datetime: '', end_datetime: '', instructor_id: '' });
          setSelectedStreamId('');
          setFilterStreamId('');
          setFilterCohortId('');
          toast.success('Session created successfully');
        } else {
          console.error('Create session failed', resp && resp.error);
          toast.error(resp?.error || 'Failed to create session');
        }
      } catch (err) {
        console.error('Create session error', err);
        toast.error('Failed to create session: ' + (err.message || 'Unknown error'));
      }
    })();
  };

  const handleUpdateSession = () => {
    (async () => {
      try {
        const payload = {
          title: editSession.title,
          start_datetime: editSession.start_datetime,
        };
        const resp = await api.updateSession(editSession.id, payload);
        if (resp && resp.success) {
          await fetchSessionsByCohort(editSession.cohort_id);
          setShowEditModal(false);
          setEditSession(null);
          toast.success('Session updated successfully');
        } else {
          toast.error(resp?.error || 'Failed to update session');
        }
      } catch (err) {
        toast.error('Failed to update session');
      }
    })();
  };

  const handleDeleteSession = async (id, cohortId) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      const resp = await api.deleteSession(id);
      if (resp && resp.success) {
        await fetchSessionsByCohort(cohortId);
        toast.success('Session deleted');
      } else {
        toast.error(resp?.error || 'Failed to delete session');
      }
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [cResp, iResp, stResp] = await Promise.all([
          api.getCohorts().catch(() => null),
          api.getInstructors().catch(() => null),
          api.getStreams().catch(() => null)
        ]);
        if (!mounted) return;
        const cData = (cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : [];
        setCohorts(cData);
        setInstructors((iResp && iResp.success && Array.isArray(iResp.data)) ? iResp.data : []);
        setStreams((stResp && stResp.success && Array.isArray(stResp.data)) ? stResp.data : []);
        if (cData.length > 0) {
          const def = cData[0];
          setFilterStreamId(def.stream_id?.toString?.() || '');
          setFilterCohortId(def.id?.toString?.() || '');
          await fetchSessionsByCohort(def.id);
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.error('Failed to load sessions page data', err);
        toast.error('Failed to load sessions');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Auto-populate instructor when cohort is selected
  useEffect(() => {
    if (newSession.cohort_id) {
      const selectedCohort = cohorts.find(c => c.id === parseInt(newSession.cohort_id, 10));
      if (selectedCohort && selectedCohort.lead_instructor_id) {
        setNewSession(prev => ({ ...prev, instructor_id: selectedCohort.lead_instructor_id.toString() }));
      }
    }
  }, [newSession.cohort_id, cohorts]);

  const sessionColumns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Cohort ID', accessor: 'cohort_id' },
    { header: 'Start', render: (row) => row.start_datetime ? new Date(row.start_datetime).toLocaleString('en-NG') : '—' },
    { header: 'End', render: (row) => row.end_datetime ? new Date(row.end_datetime).toLocaleString('en-NG') : '—' },
    { header: 'Delivery', render: (row) => <StatusBadge status={row.delivery_mode} /> },
    { header: 'Instructor ID', accessor: 'instructor_id' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); setEditSession(row); setShowEditModal(true); }} className="text-sm text-primary-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(row.id, row.cohort_id); }} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Sessions & Attendance">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Sessions</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              Schedule New Session
            </button>
          </div>
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledSelect
                label="Filter by Stream"
                value={filterStreamId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterStreamId(val);
                  setFilterCohortId('');
                  setSessions([]);
                }}
                options={streams.map(s => ({ value: s.id.toString(), label: s.title }))}
                placeholder="Select a stream"
              />
              <LabeledSelect
                label="Filter by Cohort"
                value={filterCohortId}
                onChange={async (e) => {
                  const cid = e.target.value;
                  setFilterCohortId(cid);
                  if (cid) await fetchSessionsByCohort(parseInt(cid, 10));
                }}
                options={cohorts
                  .filter(c => filterStreamId ? c.stream_id === parseInt(filterStreamId, 10) : false)
                  .map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
                placeholder={filterStreamId ? 'Select a cohort' : 'Select a stream first'}
                disabled={!filterStreamId}
              />
            </div>
          </div>
          <DataTable columns={sessionColumns} data={sessions} />
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedStreamId('');
            setNewSession({ cohort_id: '', title: '', delivery_mode: 'online', start_datetime: '', end_datetime: '', instructor_id: '' });
          }}
          title="Schedule New Session"
          size="lg"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <LabeledSelect
              label="Stream"
              value={selectedStreamId}
              onChange={(e) => {
                setSelectedStreamId(e.target.value);
                setNewSession({ ...newSession, cohort_id: '', instructor_id: '' });
              }}
              options={streams.map(s => ({ value: s.id.toString(), label: s.title }))}
              placeholder="Select a stream"
              required
            />
            <LabeledSelect
              label="Cohort"
              value={newSession.cohort_id}
              onChange={(e) => setNewSession({ ...newSession, cohort_id: e.target.value })}
              options={cohorts
                .filter(c => selectedStreamId ? c.stream_id === parseInt(selectedStreamId, 10) : false)
                .map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
              placeholder="Select a cohort"
              required
              disabled={!selectedStreamId}
            />
            <LabeledInput
              label="Title"
              value={newSession.title}
              onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              placeholder="e.g. Intro to JS"
              required
            />
            <LabeledSelect
              label="Delivery Mode"
              value={newSession.delivery_mode}
              onChange={(e) => setNewSession({ ...newSession, delivery_mode: e.target.value })}
              options={[
                { value: 'online', label: 'Online' },
                { value: 'physical', label: 'Physical' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
              required
            />
            <LabeledInput
              label="Start Date & Time"
              type="datetime-local"
              value={newSession.start_datetime}
              onChange={(e) => setNewSession({ ...newSession, start_datetime: e.target.value })}
              required
            />
            <LabeledInput
              label="End Date & Time"
              type="datetime-local"
              value={newSession.end_datetime}
              onChange={(e) => setNewSession({ ...newSession, end_datetime: e.target.value })}
              required
            />
            <LabeledInput
              label="Lead Instructor (Auto-filled)"
              value={
                newSession.instructor_id
                  ? instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))
                      ?.profile
                      ? [
                          instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))?.profile?.first_name,
                          instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))?.profile?.middle_name,
                          instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))?.profile?.last_name
                        ].filter(Boolean).join(' ') || instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))?.email
                      : instructors.find(u => u.id === parseInt(newSession.instructor_id, 10))?.email || ''
                  : ''
              }
              disabled
              placeholder="Select a cohort to auto-fill instructor"
            />
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Schedule Session
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Session"
        >
          {editSession && (
            <div className="space-y-4">
              <LabeledInput
                label="Title"
                value={editSession.title}
                onChange={(e) => setEditSession({ ...editSession, title: e.target.value })}
                required
              />
              <LabeledInput
                label="Start Date & Time"
                type="datetime-local"
                value={editSession.start_datetime}
                onChange={(e) => setEditSession({ ...editSession, start_datetime: e.target.value })}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
                <button onClick={handleUpdateSession} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">Save Changes</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
