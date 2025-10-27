import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../utils/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await api.getStudents();
        if (!mounted) return;
        setStudents((resp && resp.success && resp.data.items) || []);
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        // no-op
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filteredStudents = (students || []).filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStream = streamFilter === '' || student.stream === streamFilter;
    return matchesSearch && matchesStream;
  });

  const studentColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Stream',
      accessor: 'stream',
    },
    {
      header: 'Cohort',
      accessor: 'cohort',
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="w-32">
          <ProgressBar value={row.progress} showLabel={true} />
        </div>
      ),
    },
    {
      header: 'Attendance Rate',
      render: (row) => `${Math.round(row.attendanceRate * 100)}%`,
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <AdminLayout pageTitle="Students">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
            </div>
            <div className="flex space-x-4">
              <input
                type="search"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Streams</option>
                <option value="Web Development">Web Development</option>
                <option value="AI Essentials">AI Essentials</option>
                <option value="Data Analysis & Visualization">Data Analysis & Visualization</option>
              </select>
            </div>
          </div>
          <DataTable
            columns={studentColumns}
            data={filteredStudents}
            onRowClick={(student) => setSelectedStudent(student)}
          />
        </Card>

        <Drawer
          isOpen={selectedStudent !== null}
          onClose={() => setSelectedStudent(null)}
          title={selectedStudent?.name || ''}
        >
          {selectedStudent && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Personal Details</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Full Name:</span> {selectedStudent.name}</p>
                  <p className="text-sm"><span className="font-medium">Gender:</span> {selectedStudent.gender}</p>
                  <p className="text-sm"><span className="font-medium">Date of Birth:</span> {new Date(selectedStudent.dob).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm"><span className="font-medium">Location:</span> {selectedStudent.city}, {selectedStudent.state}, {selectedStudent.country}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {selectedStudent.phone}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Enrollment Information</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Stream:</span> {selectedStudent.stream}</p>
                  <p className="text-sm"><span className="font-medium">Cohort:</span> {selectedStudent.cohort}</p>
                  <p className="text-sm"><span className="font-medium">Enrollment Date:</span> {new Date(selectedStudent.enrollmentDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <StatusBadge status={selectedStudent.status} /></p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Performance</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Course Progress</p>
                    <ProgressBar value={selectedStudent.progress} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Attendance Rate</p>
                    <ProgressBar value={selectedStudent.attendanceRate * 100} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Certificate Eligibility</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Eligible for Certificate:</span>
                    <StatusBadge status={selectedStudent.certificateEligible ? 'Eligible' : 'Not Eligible'} />
                  </div>
                  {!selectedStudent.certificateEligible && selectedStudent.certificateEligibilityReason && (
                    <p className="text-xs text-gray-600 mt-2">Reason: {selectedStudent.certificateEligibilityReason}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                  Change Status
                </button>
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                  Send Password Reset Link
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}
