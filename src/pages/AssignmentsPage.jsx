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
import { assignments as initialAssignments, cohorts } from '../data/mockData';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    cohortId: '',
    dueDate: '',
    dueTime: '',
    description: '',
    referenceMaterial: '',
    responseType: 'link',
    maxScore: '100',
    status: 'Assigned',
  });

  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
    status: 'Graded',
  });

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const cohort = cohorts.find(c => c.id === parseInt(newAssignment.cohortId));
    const dueDateTime = new Date(`${newAssignment.dueDate}T${newAssignment.dueTime}:00+01:00`);
    
    const assignment = {
      id: assignments.length + 77,
      title: newAssignment.title,
      cohort: cohort.name,
      cohortId: cohort.id,
      stream: cohort.stream,
      dueDate: dueDateTime.toISOString(),
      description: newAssignment.description,
      referenceMaterial: newAssignment.referenceMaterial,
      responseType: newAssignment.responseType,
      maxScore: parseInt(newAssignment.maxScore),
      status: newAssignment.status,
      totalStudents: cohort.studentsEnrolled,
      submissions: [],
    };
    
    setAssignments([...assignments, assignment]);
    setShowCreateModal(false);
    setNewAssignment({
      title: '',
      cohortId: '',
      dueDate: '',
      dueTime: '',
      description: '',
      referenceMaterial: '',
      responseType: 'link',
      maxScore: '100',
      status: 'Assigned',
    });
  };

  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
      status: submission.status === 'Graded' ? 'Graded' : 'Graded',
    });
    setShowGradeModal(true);
  };

  const handleSaveGrade = () => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === selectedAssignment.id) {
        const updatedSubmissions = assignment.submissions.map(sub => {
          if (sub.id === selectedSubmission.id) {
            return {
              ...sub,
              score: parseInt(gradeData.score),
              feedback: gradeData.feedback,
              status: gradeData.status,
            };
          }
          return sub;
        });
        return { ...assignment, submissions: updatedSubmissions };
      }
      return assignment;
    });

    setAssignments(updatedAssignments);
    setSelectedAssignment({
      ...selectedAssignment,
      submissions: selectedAssignment.submissions.map(sub => {
        if (sub.id === selectedSubmission.id) {
          return {
            ...sub,
            score: parseInt(gradeData.score),
            feedback: gradeData.feedback,
            status: gradeData.status,
          };
        }
        return sub;
      }),
    });
    setShowGradeModal(false);
  };

  const assignmentColumns = [
    {
      header: 'Title',
      accessor: 'title',
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
      header: 'Due Date/Time',
      render: (row) => {
        const date = new Date(row.dueDate);
        return (
          <div>
            <p className="text-sm">{date.toLocaleDateString('en-NG')}</p>
            <p className="text-xs text-gray-500">{date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} WAT</p>
          </div>
        );
      },
    },
    {
      header: 'Submissions',
      render: (row) => `${row.submissions.length} / ${row.totalStudents}`,
    },
    {
      header: 'Needs Grading',
      render: (row) => row.submissions.filter(s => s.status === 'Submitted').length,
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
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
          <DataTable
            columns={assignmentColumns}
            data={assignments}
            onRowClick={(assignment) => setSelectedAssignment(assignment)}
          />
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
              value={newAssignment.cohortId}
              onChange={(e) => setNewAssignment({ ...newAssignment, cohortId: e.target.value })}
              options={cohorts.map(c => ({ value: c.id.toString(), label: `${c.name} · ${c.stream}` }))}
              placeholder="Select a cohort"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <LabeledInput
                label="Due Date"
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                required
              />
              <LabeledInput
                label="Due Time"
                type="time"
                value={newAssignment.dueTime}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                required
              />
            </div>
            <LabeledTextarea
              label="Description / Instructions"
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              placeholder="Detailed assignment instructions..."
              required
              rows={3}
            />
            <LabeledInput
              label="Reference Material for Students"
              value={newAssignment.referenceMaterial}
              onChange={(e) => setNewAssignment({ ...newAssignment, referenceMaterial: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="link"
                    checked={newAssignment.responseType === 'link'}
                    onChange={(e) => setNewAssignment({ ...newAssignment, responseType: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Student must submit a LINK (Google Drive, GitHub, Figma, etc.)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={newAssignment.responseType === 'text'}
                    onChange={(e) => setNewAssignment({ ...newAssignment, responseType: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Student must submit TEXT / WRITE-UP (plain text response)</span>
                </label>
              </div>
            </div>
            <LabeledInput
              label="Max Score"
              type="number"
              value={newAssignment.maxScore}
              onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
              placeholder="100"
              required
            />
            <LabeledSelect
              label="Status"
              value={newAssignment.status}
              onChange={(e) => setNewAssignment({ ...newAssignment, status: e.target.value })}
              options={[
                { value: 'Assigned', label: 'Assigned' },
                { value: 'Closed', label: 'Closed' },
              ]}
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

        <Drawer
          isOpen={selectedAssignment !== null}
          onClose={() => setSelectedAssignment(null)}
          title={selectedAssignment?.title || ''}
          width="lg"
        >
          {selectedAssignment && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Assignment Details</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Cohort:</span> {selectedAssignment.cohort} · {selectedAssignment.stream}</p>
                  <p className="text-sm"><span className="font-medium">Due:</span> {new Date(selectedAssignment.dueDate).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })} WAT</p>
                  <p className="text-sm"><span className="font-medium">Response Type:</span> {selectedAssignment.responseType === 'link' ? 'Link Submission' : 'Text Submission'}</p>
                  <p className="text-sm"><span className="font-medium">Max Score:</span> {selectedAssignment.maxScore}</p>
                  {selectedAssignment.referenceMaterial && (
                    <p className="text-sm">
                      <span className="font-medium">Reference Material:</span>{' '}
                      <a href={selectedAssignment.referenceMaterial} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        View Document
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedAssignment.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Submissions ({selectedAssignment.submissions.length} / {selectedAssignment.totalStudents})</h4>
                {selectedAssignment.submissions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedAssignment.submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{submission.studentName}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(submission.submittedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} WAT
                            </p>
                          </div>
                          <StatusBadge status={submission.status} />
                        </div>

                        <div className="my-3">
                          {selectedAssignment.responseType === 'link' && submission.responseLink && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Submitted Link:</p>
                              <a
                                href={submission.responseLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline break-all"
                              >
                                {submission.responseLink}
                              </a>
                            </div>
                          )}
                          {selectedAssignment.responseType === 'text' && submission.responseText && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Submitted Text:</p>
                              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                                {submission.responseText}
                              </div>
                            </div>
                          )}
                        </div>

                        {submission.status === 'Graded' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm"><span className="font-medium">Score:</span> {submission.score} / {selectedAssignment.maxScore}</p>
                            {submission.feedback && (
                              <p className="text-sm mt-1"><span className="font-medium">Feedback:</span> {submission.feedback}</p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleGrade(submission)}
                          className="mt-3 w-full px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                        >
                          {submission.status === 'Graded' ? 'Update Grade' : 'Grade Submission'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Drawer>

        <Modal
          isOpen={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          title="Grade Submission"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Student: {selectedSubmission?.studentName}</p>
              <p className="text-xs text-gray-500 mt-1">Assignment: {selectedAssignment?.title}</p>
            </div>

            <LabeledInput
              label="Score"
              type="number"
              value={gradeData.score}
              onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
              placeholder={`0 - ${selectedAssignment?.maxScore}`}
              required
            />

            <LabeledTextarea
              label="Feedback"
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              placeholder="Provide constructive feedback..."
              rows={4}
            />

            <LabeledSelect
              label="Status"
              value={gradeData.status}
              onChange={(e) => setGradeData({ ...gradeData, status: e.target.value })}
              options={[
                { value: 'Graded', label: 'Graded' },
                { value: 'Resubmission Requested', label: 'Resubmission Requested' },
              ]}
              required
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowGradeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrade}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Save Grade
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
