import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import LabeledSelect from '../components/ui/LabeledSelect';
import api from '../utils/api';

export default function GradingPage() {
  const [streams, setStreams] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

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
        // no toast here to keep skeleton minimal
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
        setAssignments((aResp && aResp.success && Array.isArray(aResp.data)) ? aResp.data : []);
      } catch (err) {
        // silent
      }
    })();
  }, [selectedCohortId]);

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
                options={assignments.map(a => ({ value: a.id.toString(), label: a.title }))}
                placeholder={selectedCohortId ? 'Choose an assignment' : 'Select a cohort first'}
                disabled={!selectedCohortId}
              />
            </div>

            <div className="text-sm text-gray-500">
              {selectedAssignmentId ? (
                <p>Submissions view will appear here. (To be implemented)</p>
              ) : (
                <p>Select an assignment to view submissions.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
