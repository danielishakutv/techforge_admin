import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import LabeledSelect from '../components/ui/LabeledSelect';
import LabeledInput from '../components/ui/LabeledInput';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../utils/api';
import { toast } from 'react-toastify';

export default function GradingPage() {
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [gradesMap, setGradesMap] = useState({}); // { user_id: { grade_score, grade_feedback, status } }
  const [showSingleGradeModal, setShowSingleGradeModal] = useState(false);
  const [studentToGrade, setStudentToGrade] = useState(null);
  const [singleGradeData, setSingleGradeData] = useState({ grade_score: '', grade_feedback: '', status: 'graded' });

  useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCohortId) {
      setAssignments([]);
      setSelectedAssignmentId('');
      return;
    }
    (async () => {
      try {
        const aResp = await api.getAssignments({ cohort_id: selectedCohortId });
        const data = (aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : [];
        setAssignments(data);
      } catch (err) {
        toast.error('Failed to load assignments');
      }
    })();
  }, [selectedCohortId]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setStudents([]);
      setGradesMap({});
      setSelectedAssignment(null);
      return;
    }
    (async () => {
      try {
        const studResp = await api.getAssignmentStudents(selectedAssignmentId);
        const studData = (studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : [];
        setStudents(studData);
        
        // Find the selected assignment details
        const found = assignments.find(a => a.assignment && a.assignment.id === parseInt(selectedAssignmentId, 10));
        setSelectedAssignment(found ? found.assignment : null);

        // Initialize gradesMap from existing grades
        const map = {};
        studData.forEach(s => {
          if (s.submission_id && s.grade_score !== null && s.grade_score !== undefined) {
            map[s.user_id] = {
              grade_score: s.grade_score,
              grade_feedback: s.grade_feedback || '',
              status: s.submission_status === 'graded' ? 'graded' : (s.submission_status === 'resubmission_requested' ? 'resubmission_requested' : 'graded'),
            };
          }
        });
        setGradesMap(map);
      } catch (err) {
        toast.error('Failed to load students for assignment');
      }
    })();
  }, [selectedAssignmentId, assignments]);

  const handleGradeChange = (userId, field, value) => {
    setGradesMap(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleBulkGrade = async () => {
    if (!selectedAssignmentId) {
      toast.error('Please select an assignment first');
      return;
    }
    // Only include students who have submitted and have a grade entered
    const gradesToSubmit = students
      .filter(s => s.submission_id && gradesMap[s.user_id] && gradesMap[s.user_id].grade_score !== '' && gradesMap[s.user_id].grade_score !== null && gradesMap[s.user_id].grade_score !== undefined)
      .map(s => ({
        user_id: s.user_id,
        grade_score: parseInt(gradesMap[s.user_id].grade_score, 10),
        grade_feedback: gradesMap[s.user_id].grade_feedback || '',
        status: gradesMap[s.user_id].status || 'graded',
      }));
    
    if (gradesToSubmit.length === 0) {
      toast.error('No grades to submit. Enter scores for submitted assignments.');
      return;
    }

    try {
      const resp = await api.gradeBulk(selectedAssignmentId, { grades: gradesToSubmit });
      if (resp && resp.success) {
        toast.success(`${resp.data?.graded_count || gradesToSubmit.length} grade(s) saved successfully`);
        // Reload students to reflect updated grades
        const studResp = await api.getAssignmentStudents(selectedAssignmentId);
        const studData = (studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : [];
        setStudents(studData);
      } else {
        toast.error(resp?.error || 'Failed to save grades');
      }
    } catch (err) {
      toast.error('Failed to save grades');
    }
  };

  const handleSingleGrade = async () => {
    if (!studentToGrade || !studentToGrade.submission_id) {
      toast.error('No submission to grade');
      return;
    }
    try {
      const payload = {
        grade_score: parseInt(singleGradeData.grade_score, 10),
        grade_feedback: singleGradeData.grade_feedback || '',
        status: singleGradeData.status || 'graded',
      };
      const resp = await api.gradeSubmission(studentToGrade.submission_id, payload);
      if (resp && resp.success) {
        toast.success('Grade saved successfully');
        setShowSingleGradeModal(false);
        setStudentToGrade(null);
        setSingleGradeData({ grade_score: '', grade_feedback: '', status: 'graded' });
        // Reload
        const studResp = await api.getAssignmentStudents(selectedAssignmentId);
        const studData = (studResp && studResp.success && Array.isArray(studResp.data)) ? studResp.data : [];
        setStudents(studData);
      } else {
        toast.error(resp?.error || 'Failed to save grade');
      }
    } catch (err) {
      toast.error('Failed to save grade');
    }
  };

  const openSingleGradeModal = (student) => {
    setStudentToGrade(student);
    setSingleGradeData({
      grade_score: student.grade_score !== null && student.grade_score !== undefined ? student.grade_score : '',
      grade_feedback: student.grade_feedback || '',
      status: student.submission_status === 'graded' ? 'graded' : (student.submission_status === 'resubmission_requested' ? 'resubmission_requested' : 'graded'),
    });
    setShowSingleGradeModal(true);
  };

  const studentColumns = [
    { header: 'Name', render: (row) => row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Status',
      render: (row) => {
        if (!row.submission_id) return <span className="text-xs text-gray-500">Not submitted</span>;
        if (row.submission_status === 'graded') return <StatusBadge status="graded" />;
        if (row.submission_status === 'resubmission_requested') return <StatusBadge status="resubmission requested" />;
        return <StatusBadge status="submitted" />;
      },
    },
    {
      header: 'Submitted',
      render: (row) => row.submitted_at ? new Date(row.submitted_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
    },
    {
      header: 'Response',
      render: (row) => {
        if (row.response_link) {
          return <a href={row.response_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline truncate block max-w-xs">View Link</a>;
        }
        if (row.response_text) {
          return <span className="text-xs text-gray-700 truncate block max-w-xs" title={row.response_text}>{row.response_text}</span>;
        }
        return <span className="text-xs text-gray-400">—</span>;
      },
    },
    {
      header: 'Grade',
      render: (row) => {
        if (!row.submission_id) return <span className="text-xs text-gray-400">—</span>;
        const current = gradesMap[row.user_id] || {};
        return (
          <input
            type="number"
            value={current.grade_score ?? ''}
            onChange={(e) => handleGradeChange(row.user_id, 'grade_score', e.target.value)}
            placeholder={`0-${selectedAssignment?.max_score || 100}`}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            min="0"
            max={selectedAssignment?.max_score || 100}
          />
        );
      },
    },
    {
      header: 'Feedback',
      render: (row) => {
        if (!row.submission_id) return <span className="text-xs text-gray-400">—</span>;
        const current = gradesMap[row.user_id] || {};
        return (
          <input
            type="text"
            value={current.grade_feedback ?? ''}
            onChange={(e) => handleGradeChange(row.user_id, 'grade_feedback', e.target.value)}
            placeholder="Optional feedback..."
            className="w-40 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => {
        if (!row.submission_id) return null;
        return (
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); openSingleGradeModal(row); }}
              className="text-xs text-primary-600 hover:underline"
            >
              Grade
            </button>
          </div>
        );
      },
    },
  ];

  const filteredStudents = students.filter(s => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const name = (s.display_name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    const email = (s.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <AdminLayout pageTitle="Grading">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Grade Submissions</h3>
            <p className="text-sm text-gray-600 mt-1">Select stream, cohort and assignment to view submissions for grading</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledSelect
                label="Select Stream"
                value={selectedStreamId}
                onChange={(e) => { setSelectedStreamId(e.target.value); setSelectedCohortId(''); setSelectedAssignmentId(''); setAssignments([]); }}
                options={streams.map(s => ({ value: s.id.toString(), label: s.title }))}
                placeholder="Choose a stream"
              />
              <LabeledSelect
                label="Select Cohort"
                value={selectedCohortId}
                onChange={(e) => { setSelectedCohortId(e.target.value); setSelectedAssignmentId(''); }}
                options={cohorts
                  .filter(c => selectedStreamId ? c.stream_id === parseInt(selectedStreamId, 10) : false)
                  .map(c => ({ value: c.id.toString(), label: c.cohort_name }))}
                placeholder={selectedStreamId ? 'Choose a cohort' : 'Select a stream first'}
                disabled={!selectedStreamId}
              />
              <LabeledSelect
                label="Select Assignment"
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                options={assignments.map(a => ({ value: a.assignment.id.toString(), label: a.assignment.title }))}
                placeholder={selectedCohortId ? 'Choose an assignment' : 'Select a cohort first'}
                disabled={!selectedCohortId}
              />
            </div>

            {selectedAssignmentId && selectedAssignment && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Assignment Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Max Score:</span> {selectedAssignment.max_score}
                  </div>
                  <div>
                    <span className="font-medium">Response Type:</span> {selectedAssignment.response_type}
                  </div>
                  <div>
                    <span className="font-medium">Due:</span> {selectedAssignment.due_datetime ? new Date(selectedAssignment.due_datetime.replace(' ', 'T')).toLocaleDateString('en-NG') : '—'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedAssignment.status}
                  </div>
                </div>
              </div>
            )}

            {selectedAssignmentId && students.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
                <div className="flex-1 max-w-md">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <button
                  onClick={handleBulkGrade}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Save All Grades
                </button>
              </div>
            )}
          </div>
        </Card>

        {selectedAssignmentId && students.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Students & Submissions</h3>
            </div>
            <DataTable columns={studentColumns} data={filteredStudents} />
          </Card>
        )}

        {selectedAssignmentId && students.length === 0 && (
          <Card>
            <div className="p-6 text-center text-sm text-gray-500">
              No students found for this assignment.
            </div>
          </Card>
        )}

        <Modal
          isOpen={showSingleGradeModal}
          onClose={() => { setShowSingleGradeModal(false); setStudentToGrade(null); setSingleGradeData({ grade_score: '', grade_feedback: '', status: 'graded' }); }}
          title="Grade Submission"
        >
          {studentToGrade && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                <p><span className="font-medium">Student:</span> {studentToGrade.display_name || `${studentToGrade.first_name} ${studentToGrade.last_name}`}</p>
                <p><span className="font-medium">Email:</span> {studentToGrade.email}</p>
                {studentToGrade.submitted_at && (
                  <p><span className="font-medium">Submitted:</span> {new Date(studentToGrade.submitted_at).toLocaleString('en-NG')}</p>
                )}
              </div>

              {studentToGrade.response_link && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Link</label>
                  <a href={studentToGrade.response_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                    {studentToGrade.response_link}
                  </a>
                </div>
              )}

              {studentToGrade.response_text && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Text</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
                    {studentToGrade.response_text}
                  </div>
                </div>
              )}

              <LabeledInput
                label="Grade Score"
                type="number"
                value={singleGradeData.grade_score}
                onChange={(e) => setSingleGradeData({ ...singleGradeData, grade_score: e.target.value })}
                placeholder={`0-${selectedAssignment?.max_score || 100}`}
                required
                min="0"
                max={selectedAssignment?.max_score || 100}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={singleGradeData.grade_feedback}
                  onChange={(e) => setSingleGradeData({ ...singleGradeData, grade_feedback: e.target.value })}
                  placeholder="Optional feedback for the student..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <LabeledSelect
                label="Status"
                value={singleGradeData.status}
                onChange={(e) => setSingleGradeData({ ...singleGradeData, status: e.target.value })}
                options={[
                  { value: 'graded', label: 'Graded' },
                  { value: 'resubmission_requested', label: 'Request Resubmission' },
                ]}
                required
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowSingleGradeModal(false); setStudentToGrade(null); setSingleGradeData({ grade_score: '', grade_feedback: '', status: 'graded' }); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSingleGrade}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Save Grade
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
