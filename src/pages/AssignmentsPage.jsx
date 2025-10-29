import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function AssignmentsPage() {
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    cohort_id: '',
    due_datetime: '',
    response_type: 'text',
    max_score: 100,
  });

  // Helpers
  const toJSDate = (s) => {
    if (!s) return null;
    // Accept both "YYYY-MM-DDTHH:mm[:ss]" and "YYYY-MM-DD HH:mm[:ss]"
    const str = s.includes('T') ? s : s.replace(' ', 'T');
    return new Date(str);
  };

  const formatForInput = (s) => {
    // Convert API datetime to input[type=datetime-local] (YYYY-MM-DDTHH:mm)
    const d = toJSDate(s);
    if (!d || isNaN(d.getTime())) return '';
    const pad = (n) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          title: newAssignment.title,
          cohort_id: parseInt(newAssignment.cohort_id, 10),
          response_type: newAssignment.response_type,
          due_datetime: newAssignment.due_datetime,
          max_score: parseInt(newAssignment.max_score, 10),
        };
        const resp = await api.createAssignment(payload);
        if (resp && resp.success) {
          // Reload assignments for the selected cohort if available
          if (selectedCohortId) {
            const aResp = await api.getAssignments({ cohort_id: selectedCohortId });
            setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
          }
          setShowCreateModal(false);
          setNewAssignment({ title: '', cohort_id: '', due_datetime: '', response_type: 'text', max_score: 100 });
          toast.success('Assignment created successfully');
        } else {
          console.error('Create assignment failed', resp && resp.error);
          toast.error(resp?.error || 'Failed to create assignment');
        }
      } catch (err) {
        console.error('Create assignment error', err);
        toast.error('Failed to create assignment: ' + (err.message || 'Unknown error'));
      }
    })();
  };

  const handleUpdateAssignment = () => {
    (async () => {
      try {
        const payload = {
          title: editAssignment.title,
          description: editAssignment.description || '',
          reference_material: editAssignment.reference_material || null,
          response_type: editAssignment.response_type,
          due_datetime: editAssignment.due_datetime,
          max_score: parseInt(editAssignment.max_score, 10),
        };
        const resp = await api.updateAssignment(editAssignment.id, payload);
        if (resp && resp.success) {
          if (selectedCohortId) {
            const aResp = await api.getAssignments({ cohort_id: selectedCohortId });
            setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
          }
          setShowEditModal(false);
          setEditAssignment(null);
          toast.success('Assignment updated successfully');
        } else {
          toast.error(resp?.error || 'Failed to update assignment');
        }
      } catch (err) {
        toast.error('Failed to update assignment');
      }
    })();
  };

  const handleDeleteAssignment = async (id) => {
    try {
      const resp = await api.deleteAssignment(id);
      if (resp && resp.success) {
        if (selectedCohortId) {
          const aResp = await api.getAssignments({ cohort_id: selectedCohortId });
          setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
        }
        toast.success('Assignment deleted');
        setShowDeleteModal(false);
        setAssignmentToDelete(null);
      } else {
        toast.error(resp?.error || 'Failed to delete assignment');
      }
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  useEffect(() => {
    let mounted = true;
    async function loadFilters() {
      try {
        const [sResp, cResp] = await Promise.all([
          api.getStreams().catch(() => null),
          api.getCohorts().catch(() => null),
        ]);
        if (!mounted) return;
        setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
        setCohorts((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
      } catch (err) {
        toast.error('Failed to load filters');
      }
    }
    loadFilters();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // When cohort changes, query assignments for that cohort
    if (!selectedCohortId) {
      setAssignments([]);
      return;
    }
    (async () => {
      try {
        const aResp = await api.getAssignments({ cohort_id: selectedCohortId });
        setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
      } catch (err) {
        toast.error('Failed to load assignments');
      }
    })();
  }, [selectedCohortId]);

  const handleStreamChange = (e) => {
    const val = e.target.value;
    setSelectedStreamId(val);
    setSelectedCohortId('');
    setAssignments([]);
  };

  const handleCohortChange = (e) => {
    const val = e.target.value;
    setSelectedCohortId(val);
  };

  const assignmentColumns = [
    { header: 'Title', render: (row) => row.assignment?.title || '—' },
    { header: 'Due', render: (row) => row.assignment?.due_datetime ? toJSDate(row.assignment.due_datetime).toLocaleString('en-NG') : '—' },
    { header: 'Response Type', render: (row) => row.assignment?.response_type || '—' },
    { header: 'Max Score', render: (row) => row.assignment?.max_score ?? '—' },
    { header: 'Status', render: (row) => row.assignment?.status || '—' },
    {
      header: 'Submissions',
      render: (row) => {
        const sc = row.submission_counts || {};
        return (
          <div className="text-xs text-gray-700">
            <span className="mr-3"><span className="font-medium">Submitted:</span> {sc.submitted ?? 0}</span>
            <span className="mr-3"><span className="font-medium">Graded:</span> {sc.graded ?? 0}</span>
            <span><span className="font-medium">Resub Req:</span> {sc.resubmission_requested ?? 0}</span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); setEditAssignment(row.assignment); setShowEditModal(true); }} className="text-sm text-primary-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setAssignmentToDelete(row.assignment); setShowDeleteModal(true); }} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Assignments">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Manage Assignments</h3>
            <p className="text-sm text-gray-600 mt-1">Filter by stream and cohort to view and manage assignments</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledSelect
                label="Select Stream"
                value={selectedStreamId}
                onChange={handleStreamChange}
                options={streams.map(s => ({ value: s.id.toString(), label: s.title }))}
                placeholder="Choose a stream"
              />
              <LabeledSelect
                label="Select Cohort"
                value={selectedCohortId}
                onChange={handleCohortChange}
                options={cohorts
                  .filter(c => selectedStreamId ? c.stream_id === parseInt(selectedStreamId, 10) : false)
                  .map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
                placeholder={selectedStreamId ? 'Choose a cohort' : 'Select a stream first'}
                disabled={!selectedStreamId}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-gray-600">
                {selectedStreamId && selectedCohortId ? (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100">Filters active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-50">Select filters to view</span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setNewAssignment((prev) => ({
                    ...prev,
                    cohort_id: selectedCohortId || '',
                  }));
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                disabled={!selectedCohortId}
                title={!selectedCohortId ? 'Select a cohort first' : 'Create Assignment'}
              >
                Create Assignment
              </button>
            </div>
          </div>
          {selectedCohortId ? (
            <DataTable
              columns={assignmentColumns}
              data={assignments.filter(a => {
                const term = searchTerm.trim().toLowerCase();
                if (!term) return true;
                return (a.assignment?.title || '').toLowerCase().includes(term);
              })}
            />
          ) : (
            <div className="px-6 pb-6 text-sm text-gray-500">Select a stream and cohort to view assignments.</div>
          )}
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Assignment"
          size="lg"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <LabeledInput
              label="Assignment Title"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              placeholder="e.g. Responsive Navbar Challenge"
              required
            />
            <LabeledSelect
              label="Select Cohort"
              value={newAssignment.cohort_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, cohort_id: e.target.value })}
              options={cohorts.map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
              placeholder="Select a cohort"
              required
            />
            <LabeledInput
              label="Due Date & Time"
              type="datetime-local"
              value={newAssignment.due_datetime}
              onChange={(e) => setNewAssignment({ ...newAssignment, due_datetime: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={newAssignment.response_type === 'text'}
                    onChange={(e) => setNewAssignment({ ...newAssignment, response_type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Text submission</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="link"
                    checked={newAssignment.response_type === 'link'}
                    onChange={(e) => setNewAssignment({ ...newAssignment, response_type: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Link submission</span>
                </label>
              </div>
            </div>
            <LabeledInput
              label="Max Score"
              type="number"
              value={newAssignment.max_score}
              onChange={(e) => setNewAssignment({ ...newAssignment, max_score: e.target.value })}
              placeholder="100"
              required
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
                Create Assignment
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Assignment"
          size="lg"
        >
          {editAssignment && (
            <div className="space-y-4">
              <LabeledInput
                label="Title"
                value={editAssignment.title}
                onChange={(e) => setEditAssignment({ ...editAssignment, title: e.target.value })}
                required
              />
              <LabeledInput
                label="Description"
                value={editAssignment.description || ''}
                onChange={(e) => setEditAssignment({ ...editAssignment, description: e.target.value })}
                placeholder="Assignment instructions..."
              />
              <LabeledInput
                label="Reference Material"
                value={editAssignment.reference_material || ''}
                onChange={(e) => setEditAssignment({ ...editAssignment, reference_material: e.target.value })}
                placeholder="Link to reference material (optional)"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={editAssignment.response_type === 'text'}
                      onChange={(e) => setEditAssignment({ ...editAssignment, response_type: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm">Text submission</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="link"
                      checked={editAssignment.response_type === 'link'}
                      onChange={(e) => setEditAssignment({ ...editAssignment, response_type: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm">Link submission</span>
                  </label>
                </div>
              </div>
              <LabeledInput
                label="Due Date & Time"
                type="datetime-local"
                value={formatForInput(editAssignment.due_datetime)}
                onChange={(e) => setEditAssignment({ ...editAssignment, due_datetime: e.target.value })}
                required
              />
              <LabeledInput
                label="Max Score"
                type="number"
                value={editAssignment.max_score}
                onChange={(e) => setEditAssignment({ ...editAssignment, max_score: e.target.value })}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
                <button onClick={handleUpdateAssignment} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">Save Changes</button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setAssignmentToDelete(null); }}
          title="Delete Assignment"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the assignment{' '}
              <span className="font-semibold">{assignmentToDelete?.title || ''}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setAssignmentToDelete(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => assignmentToDelete && handleDeleteAssignment(assignmentToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
