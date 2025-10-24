import { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import LabeledTextarea from '../components/ui/LabeledTextarea';
import { sessions as initialSessions, cohorts, students } from '../data/mockData';

export default function SessionsPage() {
  const [sessions, setSessions] = useState(initialSessions);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [newSession, setNewSession] = useState({
    cohortId: '',
    topic: '',
    description: '',
    instructor: '',
    deliveryMode: 'Online',
    date: '',
    time: '',
    meetingLink: '',
    venue: '',
  });

  const handleCreateSession = (e) => {
    e.preventDefault();
    const cohort = cohorts.find(c => c.id === parseInt(newSession.cohortId));
    const dateTime = new Date(`${newSession.date}T${newSession.time}:00+01:00`);
    
    const session = {
      id: sessions.length + 201,
      date: dateTime.toISOString(),
      topic: newSession.topic,
      description: newSession.description,
      cohort: cohort.name,
      cohortId: cohort.id,
      stream: cohort.stream,
      instructor: newSession.instructor,
      deliveryMode: newSession.deliveryMode,
      status: 'Scheduled',
      meetingLink: newSession.deliveryMode === 'Online' ? newSession.meetingLink : null,
      venue: newSession.deliveryMode === 'Physical' ? newSession.venue : null,
      attendance: null,
    };
    
    setSessions([...sessions, session]);
    setShowCreateModal(false);
    setNewSession({
      cohortId: '',
      topic: '',
      description: '',
      instructor: '',
      deliveryMode: 'Online',
      date: '',
      time: '',
      meetingLink: '',
      venue: '',
    });
  };

  const handleOpenAttendance = () => {
    const cohortStudents = students.filter(s => s.cohortId === selectedSession.cohortId);
    const records = cohortStudents.map(student => ({
      studentId: student.id,
      studentName: student.name,
      status: 'Present',
    }));
    setAttendanceRecords(records);
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = () => {
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const late = attendanceRecords.filter(r => r.status === 'Late').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;

    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          status: 'Completed',
          attendance: { present, late, absent },
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setSelectedSession({ ...selectedSession, attendance: { present, late, absent }, status: 'Completed' });
    setShowAttendanceModal(false);
  };

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
      header: 'Delivery Mode',
      render: (row) => <StatusBadge status={row.deliveryMode} />,
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
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
          <DataTable
            columns={sessionColumns}
            data={sessions}
            onRowClick={(session) => setSelectedSession(session)}
          />
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Schedule New Session"
          size="lg"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <LabeledSelect
              label="Cohort"
              value={newSession.cohortId}
              onChange={(e) => setNewSession({ ...newSession, cohortId: e.target.value })}
              options={cohorts.map(c => ({ value: c.id.toString(), label: `${c.name} · ${c.stream}` }))}
              placeholder="Select a cohort"
              required
            />
            <LabeledInput
              label="Topic / Title"
              value={newSession.topic}
              onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
              placeholder="e.g. HTML & CSS Foundations"
              required
            />
            <LabeledTextarea
              label="Description / Agenda"
              value={newSession.description}
              onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
              placeholder="What will be covered in this session?"
              required
            />
            <LabeledSelect
              label="Instructor"
              value={newSession.instructor}
              onChange={(e) => setNewSession({ ...newSession, instructor: e.target.value })}
              options={[
                { value: 'Daniel Okon', label: 'Daniel Okon' },
                { value: 'Emeka Adeyemi', label: 'Emeka Adeyemi' },
                { value: 'Chioma Nwosu', label: 'Chioma Nwosu' },
              ]}
              placeholder="Select instructor"
              required
            />
            <LabeledSelect
              label="Delivery Mode"
              value={newSession.deliveryMode}
              onChange={(e) => setNewSession({ ...newSession, deliveryMode: e.target.value })}
              options={[
                { value: 'Online', label: 'Online' },
                { value: 'Physical', label: 'Physical' },
                { value: 'Recording', label: 'Recording' },
              ]}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <LabeledInput
                label="Start Date"
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                required
              />
              <LabeledInput
                label="Start Time"
                type="time"
                value={newSession.time}
                onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                required
              />
            </div>
            {newSession.deliveryMode === 'Online' && (
              <LabeledInput
                label="Meeting Link"
                type="url"
                value={newSession.meetingLink}
                onChange={(e) => setNewSession({ ...newSession, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                required
              />
            )}
            {newSession.deliveryMode === 'Physical' && (
              <LabeledInput
                label="Venue"
                value={newSession.venue}
                onChange={(e) => setNewSession({ ...newSession, venue: e.target.value })}
                placeholder="e.g. Toko Academy Hub, Victoria Island, Lagos"
                required
              />
            )}
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

        <Drawer
          isOpen={selectedSession !== null}
          onClose={() => setSelectedSession(null)}
          title={selectedSession?.topic || ''}
        >
          {selectedSession && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Session Details</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Date & Time:</span> {new Date(selectedSession.date).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })} WAT</p>
                  <p className="text-sm"><span className="font-medium">Cohort:</span> {selectedSession.cohort} · {selectedSession.stream}</p>
                  <p className="text-sm"><span className="font-medium">Instructor:</span> {selectedSession.instructor}</p>
                  <p className="text-sm"><span className="font-medium">Delivery Mode:</span> <StatusBadge status={selectedSession.deliveryMode} /></p>
                  {selectedSession.meetingLink && (
                    <p className="text-sm"><span className="font-medium">Meeting Link:</span> <a href={selectedSession.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{selectedSession.meetingLink}</a></p>
                  )}
                  {selectedSession.venue && (
                    <p className="text-sm"><span className="font-medium">Venue:</span> {selectedSession.venue}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedSession.description}</p>
              </div>

              {selectedSession.attendance && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-700">Present</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">{selectedSession.attendance.present}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-xs text-yellow-700">Late</p>
                      <p className="text-2xl font-bold text-yellow-900 mt-1">{selectedSession.attendance.late}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-red-700">Absent</p>
                      <p className="text-2xl font-bold text-red-900 mt-1">{selectedSession.attendance.absent}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleOpenAttendance}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  {selectedSession.attendance ? 'Update Attendance' : 'Mark Attendance'}
                </button>
              </div>
            </div>
          )}
        </Drawer>

        <Modal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          title="Mark Attendance"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Mark attendance for {selectedSession?.cohort} · {selectedSession?.topic}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendanceRecords.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{record.studentName}</span>
                  <select
                    value={record.status}
                    onChange={(e) => {
                      const updated = [...attendanceRecords];
                      updated[idx].status = e.target.value;
                      setAttendanceRecords(updated);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
