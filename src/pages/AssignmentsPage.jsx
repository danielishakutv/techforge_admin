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
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    cohort_id: '',
    due_datetime: '',
    response_type: 'text',
    max_score: 100,
  });

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
          const aResp = await api.getAssignments();
          setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
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
          due_datetime: editAssignment.due_datetime,
        };
        const resp = await api.updateAssignment(editAssignment.id, payload);
        if (resp && resp.success) {
          const aResp = await api.getAssignments();
          setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
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
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const resp = await api.deleteAssignment(id);
      if (resp && resp.success) {
        const aResp = await api.getAssignments();
        setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
        toast.success('Assignment deleted');
      } else {
        toast.error(resp?.error || 'Failed to delete assignment');
      }
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [aResp, cResp] = await Promise.all([api.getAssignments().catch(() => null), api.getCohorts().catch(() => null)]);
        if (!mounted) return;
        setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
        setCohorts((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
      } catch (err) {
        console.error('Failed to load assignments page data', err);
        toast.error('Failed to load assignments');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const assignmentColumns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Cohort ID', accessor: 'cohort_id' },
    { header: 'Due', render: (row) => row.due_datetime ? new Date(row.due_datetime).toLocaleString('en-NG') : '—' },
    { header: 'Max Score', accessor: 'max_score' },
    { header: 'Response Type', accessor: 'response_type' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); setEditAssignment(row); setShowEditModal(true); }} className="text-sm text-primary-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(row.id); }} className="text-sm text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Assignments & Grading">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Assignments</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              Create Assignment
            </button>
          </div>
          <DataTable columns={assignmentColumns} data={assignments} />
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
                label="Due Date & Time"
                type="datetime-local"
                value={editAssignment.due_datetime}
                onChange={(e) => setEditAssignment({ ...editAssignment, due_datetime: e.target.value })}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
                <button onClick={handleUpdateAssignment} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">Save Changes</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
