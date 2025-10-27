import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function CohortsPage() {
  const [activeTab, setActiveTab] = useState('cohorts');
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [sResp, cResp, uResp] = await Promise.all([
          api.getStreams().catch(() => null),
          api.getCohorts().catch(() => null),
          api.getInstructors().catch(() => null),
        ]);
        if (!mounted) return;
        
          // All responses now return { success, data, error } envelope
          setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
        setCohorts(
            (cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []
        );
        setInstructors(
            (uResp && uResp.success && Array.isArray(uResp.data)) ? uResp.data : []
        );
      } catch (err) {
        console.error('Failed to load cohorts/streams:', err);
          toast.error('Failed to load data: ' + (err.message || 'Unknown error'));
      } finally {
        // no-op
      }
    }
    load();
    return () => { mounted = false; };
  }, []);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [showEditCohortModal, setShowEditCohortModal] = useState(false);
  const [editCohort, setEditCohort] = useState(null);
  
  const [newStream, setNewStream] = useState({
    title: '',
    duration_weeks: '',
  });
  const [editStream, setEditStream] = useState(null);
  const [showEditStreamModal, setShowEditStreamModal] = useState(false);

  const [newCohort, setNewCohort] = useState({
    cohort_name: '',
    stream_id: '',
    lead_instructor_id: '',
    start_date: '',
    end_date: '',
    status: 'upcoming',
  });

  const handleCreateStream = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = { title: newStream.title, duration_weeks: parseInt(newStream.duration_weeks || 0, 10) };
        const resp = await api.createStream(payload);
        if (resp && resp.success) {
          // refresh streams
          const sResp = await api.getStreams();
            setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
          setShowStreamModal(false);
          setNewStream({ title: '', duration_weeks: '' });
            toast.success('Stream created successfully');
        } else {
          console.error('Create stream failed', resp && resp.error);
            toast.error(resp?.error || 'Failed to create stream');
        }
      } catch (err) {
        console.error('Create stream error', err);
          toast.error('Failed to create stream: ' + (err.message || 'Unknown error'));
      }
    })();
  };

  const handleCreateCohort = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          cohort_name: newCohort.cohort_name,
          stream_id: newCohort.stream_id ? parseInt(newCohort.stream_id, 10) : undefined,
          start_date: newCohort.start_date,
          status: (newCohort.status || '').toLowerCase(),
          lead_instructor_id: newCohort.lead_instructor_id ? parseInt(newCohort.lead_instructor_id, 10) : undefined,
        };
        if (newCohort.end_date) {
          payload.end_date = newCohort.end_date;
        }
        if (!payload.stream_id || !payload.cohort_name || !payload.start_date || !payload.lead_instructor_id) {
            toast.error('Please fill all required fields');
          return;
        }
        const resp = await api.createCohort(payload);
        if (resp && resp.success) {
          const cResp = await api.getCohorts();
          setCohorts(
              (cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []
          );
          setShowCohortModal(false);
          setNewCohort({ cohort_name: '', stream_id: '', lead_instructor_id: '', start_date: '', end_date: '', status: 'upcoming' });
            toast.success('Cohort created successfully');
        } else {
          console.error('Create cohort failed', resp && resp.error);
            toast.error(resp?.error || 'Failed to create cohort');
        }
      } catch (err) {
        console.error('Create cohort error', err);
          toast.error('Failed to create cohort: ' + (err.message || 'Unknown error'));
      }
    })();
  };

  const handleDeleteStream = async (id) => {
    if (!window.confirm('Delete this stream? This cannot be undone.')) return;
    try {
      const resp = await api.deleteStream(id);
      if (resp && resp.success) {
        const sResp = await api.getStreams();
        setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
        toast.success('Stream deleted');
      } else {
        toast.error(resp?.error || 'Failed to delete stream');
      }
    } catch (err) {
      toast.error('Failed to delete stream');
    }
  };

  const handleDeleteCohort = async (id) => {
    if (!window.confirm('Delete this cohort? This cannot be undone.')) return;
    try {
      const resp = await api.deleteCohort(id);
      if (resp && resp.success) {
        const cResp = await api.getCohorts();
        setCohorts((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
        toast.success('Cohort deleted');
      } else {
        toast.error(resp?.error || 'Failed to delete cohort');
      }
    } catch (err) {
      toast.error('Failed to delete cohort');
    }
  };

  const streamColumns = [
    {
      header: 'Title',
      accessor: 'title',
    },
    {
      header: 'Duration',
      render: (row) => `${row.duration_weeks} weeks`,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            className="text-sm text-primary-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setEditStream({ id: row.id, title: row.title || '', duration_weeks: row.duration_weeks || 0 });
              setShowEditStreamModal(true);
            }}
          >
            Edit
          </button>
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteStream(row.id);
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const cohortColumns = [
    {
      header: 'Cohort Name',
      accessor: 'cohort_name',
    },
    {
      header: 'Stream',
      accessor: 'stream_title',
    },
    {
      header: 'Start / End Dates',
      render: (row) => (
        <div>
          <p className="text-sm">{row.start_date ? new Date(row.start_date).toLocaleDateString('en-NG') : '—'}</p>
          <p className="text-xs text-gray-500">{row.end_date ? new Date(row.end_date).toLocaleDateString('en-NG') : '—'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Lead Instructor',
      render: (row) => {
        const instructor = instructors.find(u => u.id === row.lead_instructor_id);
        if (!instructor) return row.lead_instructor_id || '—';
        const name = instructor.profile
          ? [instructor.profile.first_name, instructor.profile.middle_name, instructor.profile.last_name].filter(Boolean).join(' ')
          : instructor.email;
        return name || instructor.email || '—';
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCohort(row.id);
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Cohorts & Streams">
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('cohorts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cohorts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cohorts
            </button>
            <button
              onClick={() => setActiveTab('streams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'streams'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Streams
            </button>
          </nav>
        </div>

        {activeTab === 'streams' && (
          <Card>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Streams</h3>
              <button
                onClick={() => setShowStreamModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Create New Stream
              </button>
            </div>
            <DataTable columns={streamColumns} data={streams} />
          </Card>
        )}

        {activeTab === 'cohorts' && (
          <Card>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cohorts</h3>
              <button
                onClick={() => setShowCohortModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Create New Cohort
              </button>
            </div>
            <DataTable
              columns={cohortColumns}
              data={cohorts}
              onRowClick={(cohort) => setSelectedCohort(cohort)}
            />
          </Card>
        )}

        <Modal
          isOpen={showStreamModal}
          onClose={() => setShowStreamModal(false)}
          title="Create New Stream"
        >
          <form onSubmit={handleCreateStream} className="space-y-4">
            <LabeledInput
              label="Title"
              value={newStream.title}
              onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
              placeholder="e.g. Full Stack"
              required
            />
            <LabeledInput
              label="Duration (weeks)"
              type="number"
              value={newStream.duration_weeks}
              onChange={(e) => setNewStream({ ...newStream, duration_weeks: e.target.value })}
              placeholder="8"
              required
            />
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowStreamModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Create Stream
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Stream Modal */}
        <Modal
          isOpen={showEditStreamModal}
          onClose={() => setShowEditStreamModal(false)}
          title="Edit Stream"
        >
          {editStream && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                (async () => {
                  try {
                    const payload = {
                      title: editStream.title,
                      duration_weeks: parseInt(editStream.duration_weeks || 0, 10),
                    };
                    const resp = await api.updateStream(editStream.id, payload);
                    if (resp && resp.success) {
                      const sResp = await api.getStreams();
                        setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
                      setShowEditStreamModal(false);
                      setEditStream(null);
                        toast.success('Stream updated successfully');
                    } else {
                      console.error('Update stream failed', resp && resp.error);
                        toast.error(resp?.error || 'Failed to update stream');
                    }
                  } catch (err) {
                    console.error('Update stream error', err);
                      toast.error('Failed to update stream: ' + (err.message || 'Unknown error'));
                  }
                })();
              }}
              className="space-y-4"
            >
              <LabeledInput
                label="Title"
                value={editStream.title}
                onChange={(e) => setEditStream({ ...editStream, title: e.target.value })}
                required
              />
              <LabeledInput
                label="Duration (weeks)"
                type="number"
                value={editStream.duration_weeks}
                onChange={(e) => setEditStream({ ...editStream, duration_weeks: e.target.value })}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditStreamModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>

        <Modal
          isOpen={showCohortModal}
          onClose={() => setShowCohortModal(false)}
          title="Create New Cohort"
        >
          <form onSubmit={handleCreateCohort} className="space-y-4">
            <LabeledInput
              label="Cohort Name"
              value={newCohort.cohort_name}
              onChange={(e) => setNewCohort({ ...newCohort, cohort_name: e.target.value })}
              placeholder="e.g. FS Oct 2025"
              required
            />
            <LabeledSelect
              label="Assign Stream"
              value={newCohort.stream_id}
              onChange={(e) => setNewCohort({ ...newCohort, stream_id: e.target.value })}
              options={streams.map(s => ({ value: s.id, label: s.title }))}
              placeholder="Select a stream"
              required
            />
            <LabeledSelect
              label="Lead Instructor"
              value={newCohort.lead_instructor_id}
              onChange={(e) => setNewCohort({ ...newCohort, lead_instructor_id: e.target.value })}
              options={instructors.map(u => ({
                value: u.id,
                label: u.profile ? [u.profile.first_name, u.profile.middle_name, u.profile.last_name].filter(Boolean).join(' ') || u.email : u.email,
              }))}
              placeholder="Select instructor"
              required
            />
            <LabeledInput
              label="Start Date"
              type="date"
              value={newCohort.start_date}
              onChange={(e) => setNewCohort({ ...newCohort, start_date: e.target.value })}
              required
            />
            <LabeledInput
              label="End Date"
              type="date"
              value={newCohort.end_date}
              onChange={(e) => setNewCohort({ ...newCohort, end_date: e.target.value })}
              required
            />
            <LabeledSelect
              label="Status"
              value={newCohort.status}
              onChange={(e) => setNewCohort({ ...newCohort, status: e.target.value })}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
              ]}
              required
            />
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCohortModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Create Cohort
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Cohort Modal */}
        <Modal
          isOpen={showEditCohortModal}
          onClose={() => setShowEditCohortModal(false)}
          title="Edit Cohort"
        >
          {editCohort && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                (async () => {
                  try {
                    const payload = {
                      cohort_name: editCohort.cohort_name,
                      stream_id: editCohort.stream_id ? parseInt(editCohort.stream_id, 10) : undefined,
                      start_date: editCohort.start_date,
                      status: (editCohort.status || '').toLowerCase(),
                      lead_instructor_id: editCohort.lead_instructor_id ? parseInt(editCohort.lead_instructor_id, 10) : undefined,
                    };
                    if (editCohort.end_date) {
                      payload.end_date = editCohort.end_date;
                    }
                    const resp = await api.updateCohort(editCohort.id, payload);
                    if (resp && resp.success) {
                      const cResp = await api.getCohorts();
                      setCohorts(
                          (cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []
                      );
                      setShowEditCohortModal(false);
                      setEditCohort(null);
                        toast.success('Cohort updated successfully');
                    } else {
                      console.error('Update cohort failed', resp && resp.error);
                        toast.error(resp?.error || 'Failed to update cohort');
                    }
                  } catch (err) {
                    console.error('Update cohort error', err);
                      toast.error('Failed to update cohort: ' + (err.message || 'Unknown error'));
                  }
                })();
              }}
              className="space-y-4"
            >
              <LabeledInput
                label="Cohort Name"
                value={editCohort.cohort_name}
                onChange={(e) => setEditCohort({ ...editCohort, cohort_name: e.target.value })}
                required
              />
              <LabeledSelect
                label="Assign Stream"
                value={editCohort.stream_id}
                onChange={(e) => setEditCohort({ ...editCohort, stream_id: e.target.value })}
                options={streams.map(s => ({ value: s.id, label: s.title }))}
                placeholder="Select a stream"
                required
              />
              <LabeledSelect
                label="Lead Instructor"
                value={editCohort.lead_instructor_id}
                onChange={(e) => setEditCohort({ ...editCohort, lead_instructor_id: e.target.value })}
                options={instructors.map(u => ({
                  value: u.id,
                  label: u.profile ? [u.profile.first_name, u.profile.middle_name, u.profile.last_name].filter(Boolean).join(' ') || u.email : u.email,
                }))}
                placeholder="Select instructor"
                required
              />
              <LabeledInput
                label="Start Date"
                type="date"
                value={editCohort.start_date}
                onChange={(e) => setEditCohort({ ...editCohort, start_date: e.target.value })}
                required
              />
              <LabeledInput
                label="End Date"
                type="date"
                value={editCohort.end_date}
                onChange={(e) => setEditCohort({ ...editCohort, end_date: e.target.value })}
              />
              <LabeledSelect
                label="Status"
                value={editCohort.status}
                onChange={(e) => setEditCohort({ ...editCohort, status: e.target.value })}
                options={[
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                ]}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditCohortModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>

        <Drawer
          isOpen={selectedCohort !== null}
          onClose={() => setSelectedCohort(null)}
          title={selectedCohort?.cohort_name || ''}
        >
          {selectedCohort && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Stream:</span> {selectedCohort.stream_title || '—'}</p>
                  <p className="text-sm">
                    <span className="font-medium">Lead Instructor:</span>{' '}
                    {(() => {
                      const instructor = instructors.find(u => u.id === selectedCohort.lead_instructor_id);
                      if (!instructor) return selectedCohort.lead_instructor_id || '—';
                      const name = instructor.profile
                        ? [instructor.profile.first_name, instructor.profile.middle_name, instructor.profile.last_name].filter(Boolean).join(' ')
                        : instructor.email;
                      return name || instructor.email || '—';
                    })()}
                  </p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <StatusBadge status={selectedCohort.status} /></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Dates</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Start:</span> {selectedCohort.start_date || '—'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">End:</span> {selectedCohort.end_date || '—'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditCohort({
                      id: selectedCohort.id,
                      cohort_name: selectedCohort.cohort_name || '',
                      stream_id: selectedCohort.stream_id || '',
                      lead_instructor_id: selectedCohort.lead_instructor_id || '',
                      start_date: selectedCohort.start_date || '',
                      end_date: selectedCohort.end_date || '',
                      status: selectedCohort.status || 'upcoming',
                    });
                    setShowEditCohortModal(true);
                    setSelectedCohort(null);
                  }}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Edit Cohort Details
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}
