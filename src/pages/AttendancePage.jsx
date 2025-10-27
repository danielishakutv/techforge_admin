import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import LabeledSelect from '../components/ui/LabeledSelect';
import Modal from '../components/ui/Modal';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function AttendancePage() {
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  const [attendanceMap, setAttendanceMap] = useState({}); // { user_id: 'present'|'absent'|'late' }
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load streams and cohorts on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [sResp, cResp] = await Promise.all([
          api.getStreams().catch(() => null),
          api.getCohorts().catch(() => null),
        ]);
        if (!mounted) return;
        setStreams((sResp && sResp.success && Array.isArray(sResp.data)) ? sResp.data : []);
        setCohorts((cResp && cResp.success && Array.isArray(cResp.data)) ? cResp.data : []);
      } catch (err) {
        console.error('Failed to load attendance page data', err);
        toast.error('Failed to load data');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCohortId) {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }
    (async () => {
      try {
        const resp = await api.getSessions({ cohort_id: selectedCohortId });
        setSessions((resp && resp.success && Array.isArray(resp.data)) ? resp.data : []);
        setSelectedSessionId('');
      } catch (err) {
        toast.error('Failed to load sessions');
      }
    })();
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedSessionId || !selectedCohortId) {
      setStudents([]);
      setSummary(null);
      setAttendanceMap({});
      return;
    }
    (async () => {
      try {
        const [studResp, attResp] = await Promise.all([
          api.getStudentsForCohort(selectedCohortId).catch(() => null),
          api.getSessionAttendance(selectedSessionId).catch(() => null),
        ]);
        const studData = (studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : [];
        setStudents(studData);
        
        if (attResp && attResp.success && attResp.data) {
          setSummary(attResp.data.summary || null);
          // Build map from existing attendance
          const map = {};
          (attResp.data.attendance || []).forEach(a => {
            map[a.user_id] = a.status;
          });
          setAttendanceMap(map);
        } else {
          setSummary(null);
          setAttendanceMap({});
        }
      } catch (err) {
        toast.error('Failed to load students or attendance');
      }
    })();
  }, [selectedSessionId, selectedCohortId]);

  const handleStreamChange = (e) => {
    const val = e.target.value;
    setSelectedStreamId(val);
    setSelectedCohortId('');
    setSelectedSessionId('');
    setSessions([]);
    setStudents([]);
    setSummary(null);
    setAttendanceMap({});
  };

  const handleCohortChange = (e) => {
    const val = e.target.value;
    setSelectedCohortId(val);
    setSelectedSessionId('');
    setStudents([]);
    setSummary(null);
    setAttendanceMap({});
  };

  const handleSessionChange = (e) => {
    setSelectedSessionId(e.target.value);
  };

  const handleStatusChange = (userId, status) => {
    setAttendanceMap(prev => ({ ...prev, [userId]: status }));
  };

  const handleMarkAttendance = async () => {
    if (!selectedSessionId) {
      toast.error('Please select a session first');
      return;
    }
    const records = students.map(s => ({
      user_id: s.user_id,
      status: attendanceMap[s.user_id] || 'absent',
    }));
    try {
      const resp = await api.markAttendance({
        session_id: parseInt(selectedSessionId, 10),
        attendance: records,
      });
      if (resp && resp.success) {
        toast.success('Attendance marked successfully');
        // Reload attendance
        const attResp = await api.getSessionAttendance(selectedSessionId);
        if (attResp && attResp.success && attResp.data) {
          setSummary(attResp.data.summary || null);
        }
      } else {
        toast.error(resp?.error || 'Failed to mark attendance');
      }
    } catch (err) {
      toast.error('Failed to mark attendance');
    }
  };

  const handleUpdateSingle = async (userId, status) => {
    if (!selectedSessionId) return;
    try {
      const resp = await api.updateSingleAttendance(selectedSessionId, userId, status);
      if (resp && resp.success) {
        toast.success('Attendance updated');
        // Reload
        const attResp = await api.getSessionAttendance(selectedSessionId);
        if (attResp && attResp.success && attResp.data) {
          setSummary(attResp.data.summary || null);
          const map = {};
          (attResp.data.attendance || []).forEach(a => {
            map[a.user_id] = a.status;
          });
          setAttendanceMap(map);
        }
      } else {
        toast.error(resp?.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Failed to update attendance');
    }
  };

  const handleDeleteSingle = async (userId) => {
    if (!selectedSessionId) return;
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      const resp = await api.deleteSingleAttendance(selectedSessionId, userId);
      if (resp && resp.success) {
        toast.success('Attendance record deleted');
        // Reload
        const attResp = await api.getSessionAttendance(selectedSessionId);
        if (attResp && attResp.success && attResp.data) {
          setSummary(attResp.data.summary || null);
          const map = {};
          (attResp.data.attendance || []).forEach(a => {
            map[a.user_id] = a.status;
          });
          setAttendanceMap(map);
        }
      } else {
        toast.error(resp?.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete attendance');
    }
  };

  const handleDeleteAllAttendance = async () => {
    if (!selectedSessionId) return;
    try {
      const resp = await api.deleteSessionAttendance(selectedSessionId);
      if (resp && resp.success) {
        toast.success('All attendance records cleared for this session');
        setShowDeleteModal(false);
        // Reload
        const attResp = await api.getSessionAttendance(selectedSessionId);
        if (attResp && attResp.success && attResp.data) {
          setSummary(attResp.data.summary || null);
        } else {
          setSummary(null);
        }
        setAttendanceMap({});
      } else {
        toast.error(resp?.error || 'Failed to clear attendance');
      }
    } catch (err) {
      toast.error('Failed to clear attendance');
    }
  };

  const studentColumns = [
    {
      header: 'Name',
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Status',
      render: (row) => {
        const current = attendanceMap[row.user_id] || 'absent';
        return (
          <select
            value={current}
            onChange={(e) => handleStatusChange(row.user_id, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateSingle(row.user_id, attendanceMap[row.user_id] || 'absent');
            }}
            className="text-sm text-primary-600 hover:underline"
          >
            Update
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSingle(row.user_id);
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Attendance">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">Select stream, cohort, and session to mark or manage attendance</p>
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
              <LabeledSelect
                label="Select Session"
                value={selectedSessionId}
                onChange={handleSessionChange}
                options={sessions.map(s => ({ value: s.id.toString(), label: s.title }))}
                placeholder={selectedCohortId ? 'Choose a session' : 'Select a cohort first'}
                disabled={!selectedCohortId}
              />
            </div>

            {summary && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Attendance Summary</h4>
                <div className="flex space-x-6 text-sm">
                  <div>
                    <span className="font-medium">Present:</span>{' '}
                    <span className="text-green-600">{summary.present || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Absent:</span>{' '}
                    <span className="text-red-600">{summary.absent || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Late:</span>{' '}
                    <span className="text-yellow-600">{summary.late || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedSessionId && students.length > 0 && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleMarkAttendance}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Mark/Update Attendance
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Clear All Attendance
                </button>
              </div>
            )}
          </div>
        </Card>

        {selectedSessionId && students.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Students</h3>
            </div>
            <DataTable columns={studentColumns} data={students} />
          </Card>
        )}

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Clear All Attendance"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to clear <span className="font-semibold">all attendance records</span> for this session? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllAttendance}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
