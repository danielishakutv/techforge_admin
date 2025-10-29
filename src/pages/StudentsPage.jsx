import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cohort_id: '',
  });
  

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [studResp, streamResp, cohortResp] = await Promise.all([
          api.getStudents().catch(() => null),
          api.getStreams().catch(() => null),
          api.getCohorts().catch(() => null),
        ]);
        if (!mounted) return;
        setStudents((studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : []);
        setStreams((streamResp && streamResp.success && Array.isArray(streamResp.data)) ? streamResp.data : []);
        setCohorts((cohortResp && cohortResp.success && Array.isArray(cohortResp.data)) ? cohortResp.data : []);
      } catch (err) {
        console.error('Failed to load students page data', err);
        toast.error('Failed to load data');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const loadStudents = async () => {
    try {
      const params = {};
      if (streamFilter) params.stream_id = streamFilter;
      if (cohortFilter) params.cohort_id = cohortFilter;
      const resp = await api.getStudents(params);
      setStudents((resp && resp.success && Array.isArray(resp.data)) ? resp.data : []);
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamFilter, cohortFilter]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const resp = await api.createStudent(newStudent);
      if (resp && resp.success) {
        toast.success('Student created successfully');
        setShowCreateModal(false);
        setNewStudent({ first_name: '', last_name: '', email: '', phone: '', cohort_id: '' });
        loadStudents();
      } else {
        toast.error(resp?.error || 'Failed to create student');
      }
    } catch (err) {
      toast.error('Failed to create student');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!studentToEdit) return;
    try {
      const payload = {
        first_name: studentToEdit.first_name,
        last_name: studentToEdit.last_name,
        email: studentToEdit.email,
        phone: studentToEdit.phone,
      };
      const resp = await api.updateStudent(studentToEdit.user_id, payload);
      if (resp && resp.success) {
        toast.success('Student updated successfully');
        setShowEditModal(false);
        setStudentToEdit(null);
        loadStudents();
      } else {
        toast.error(resp?.error || 'Failed to update student');
      }
    } catch (err) {
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const resp = await api.deleteStudent(studentToDelete.user_id);
      if (resp && resp.success) {
        toast.success('Student deleted successfully');
        setShowDeleteModal(false);
        setStudentToDelete(null);
        loadStudents();
      } else {
        toast.error(resp?.error || 'Failed to delete student');
      }
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const filteredStudents = (students || []).filter(student => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const name = (student.full_name || student.display_name || `${student.first_name || ''} ${student.last_name || ''}`).toLowerCase();
    const email = (student.email || '').toLowerCase();
    const phone = (student.phone_number || student.phone || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      toast.warn('No students to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Cohort', 'Stream', 'Progress (%)', 'Attendance (%)', 'Status', 'Certificate Eligible'];
    const rows = filteredStudents.map(s => [
      s.full_name || s.display_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—',
      s.email || '—',
      s.phone_number || s.phone || '—',
      s.cohort_name || '—',
      s.stream_title || '—',
      s.progress_percent !== undefined ? s.progress_percent : '—',
      s.attendance_rate !== undefined ? s.attendance_rate : '—',
      s.completion_status || '—',
      s.certificate_eligible ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell);
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
          ? `"${cellStr.replace(/"/g, '""')}"`
          : cellStr;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Students exported to CSV');
  };

  const exportToPDF = () => {
    if (filteredStudents.length === 0) {
      toast.warn('No students to export');
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.text('Students Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

      const headers = [['Name', 'Email', 'Phone', 'Cohort', 'Stream', 'Progress (%)', 'Attendance (%)', 'Status', 'Cert. Eligible']];
      const rows = filteredStudents.map(s => [
        s.full_name || s.display_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—',
        s.email || '—',
        s.phone_number || s.phone || '—',
        s.cohort_name || '—',
        s.stream_title || '—',
        s.progress_percent !== undefined ? s.progress_percent : '—',
        s.attendance_rate !== undefined ? s.attendance_rate : '—',
        s.completion_status || '—',
        s.certificate_eligible ? 'Yes' : 'No',
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 35 },
      });

      doc.save(`students_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Students exported to PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
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
      header: 'Phone', 
      accessor: 'phone_number',
      render: (row) => row.phone_number || row.phone || '—',
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
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setStudentToEdit(row); setShowEditModal(true); }}
            className="text-sm text-primary-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setStudentToDelete(row); setShowDeleteModal(true); }}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Students">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Students</h3>
              <div className="flex space-x-3">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Add Student
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="search"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
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
          <DataTable columns={studentColumns} data={filteredStudents} />
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setNewStudent({ first_name: '', last_name: '', email: '', phone: '', cohort_id: '' }); }}
          title="Add New Student"
          size="lg"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <LabeledInput
              label="First Name"
              value={newStudent.first_name}
              onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
              required
            />
            <LabeledInput
              label="Last Name"
              value={newStudent.last_name}
              onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
              required
            />
            <LabeledInput
              label="Email"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              required
            />
            <LabeledInput
              label="Phone"
              type="tel"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              placeholder="+234..."
            />
            <LabeledSelect
              label="Cohort"
              value={newStudent.cohort_id}
              onChange={(e) => setNewStudent({ ...newStudent, cohort_id: e.target.value })}
              options={cohorts.map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
              placeholder="Select a cohort"
              required
            />
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setNewStudent({ first_name: '', last_name: '', email: '', phone: '', cohort_id: '' }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Add Student
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setStudentToEdit(null); }}
          title="Edit Student"
          size="lg"
        >
          {studentToEdit && (
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <LabeledInput
                label="First Name"
                value={studentToEdit.first_name}
                onChange={(e) => setStudentToEdit({ ...studentToEdit, first_name: e.target.value })}
                required
              />
              <LabeledInput
                label="Last Name"
                value={studentToEdit.last_name}
                onChange={(e) => setStudentToEdit({ ...studentToEdit, last_name: e.target.value })}
                required
              />
              <LabeledInput
                label="Email"
                type="email"
                value={studentToEdit.email}
                onChange={(e) => setStudentToEdit({ ...studentToEdit, email: e.target.value })}
                required
              />
              <LabeledInput
                label="Phone"
                type="tel"
                value={studentToEdit.phone || ''}
                onChange={(e) => setStudentToEdit({ ...studentToEdit, phone: e.target.value })}
                placeholder="+234..."
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setStudentToEdit(null); }}
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
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setStudentToDelete(null); }}
          title="Delete Student"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {studentToDelete?.full_name || studentToDelete?.display_name || `${studentToDelete?.first_name || ''} ${studentToDelete?.last_name || ''}`.trim()}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setStudentToDelete(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
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
