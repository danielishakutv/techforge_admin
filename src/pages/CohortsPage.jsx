import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import StatusBadge from '../components/ui/StatusBadge';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import LabeledTextarea from '../components/ui/LabeledTextarea';
import { streams as initialStreams, cohorts as initialCohorts } from '../data/mockData';
import api from '../utils/api';

export default function CohortsPage() {
  const [activeTab, setActiveTab] = useState('cohorts');
  const [streams, setStreams] = useState(initialStreams);
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  
  const [newStream, setNewStream] = useState({
    name: '',
    description: '',
    duration: '',
    status: 'Active',
  });

  const [newCohort, setNewCohort] = useState({
    name: '',
    stream: '',
    leadInstructor: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
  });

  const handleCreateStream = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = { ...newStream, duration: parseInt(newStream.duration) };
        const res = await api.createStream(payload);
        const created = res?.success ? res.data : { id: streams.length + 1, ...payload };
        setStreams(prev => [...prev, created]);
      } catch (err) {
        setStreams(prev => [...prev, { id: prev.length + 1, ...newStream, duration: parseInt(newStream.duration) }]);
      } finally {
        setShowStreamModal(false);
        setNewStream({ name: '', description: '', duration: '', status: 'Active' });
      }
    })();
  };

  const handleCreateCohort = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = { ...newCohort };
        const res = await api.createCohort(payload);
        const created = res?.success ? res.data : { id: cohorts.length + 1, ...payload, studentsEnrolled: 0, attendanceRate: 0, avgProgress: 0, certificateEligible: 0 };
        setCohorts(prev => [...prev, created]);
      } catch (err) {
        setCohorts(prev => [...prev, { id: prev.length + 1, ...newCohort, studentsEnrolled: 0, attendanceRate: 0, avgProgress: 0, certificateEligible: 0 }]);
      } finally {
        setShowCohortModal(false);
        setNewCohort({ name: '', stream: '', leadInstructor: '', startDate: '', endDate: '', status: 'Upcoming' });
      }
    })();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [streamsRes, cohortsRes] = await Promise.all([api.getStreams(), api.getCohorts()]);
        if (!mounted) return;
        setStreams(streamsRes?.success ? streamsRes.data.items : initialStreams);
        setCohorts(cohortsRes?.success ? cohortsRes.data.items : initialCohorts);
      } catch (err) {
        setStreams(initialStreams);
        setCohorts(initialCohorts);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const streamColumns = [
    {
      header: 'Stream Name',
      accessor: 'name',
    },
    {
      header: 'Duration',
      render: (row) => `${row.duration} weeks`,
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const cohortColumns = [
    {
      header: 'Cohort Name',
      accessor: 'name',
    },
    {
      header: 'Stream',
      accessor: 'stream',
    },
    {
      header: 'Start / End Dates',
      render: (row) => (
        <div>
          <p className="text-sm">{new Date(row.startDate).toLocaleDateString('en-NG')}</p>
          <p className="text-xs text-gray-500">{new Date(row.endDate).toLocaleDateString('en-NG')}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Students Enrolled',
      accessor: 'studentsEnrolled',
    },
    {
      header: 'Lead Instructor',
      accessor: 'leadInstructor',
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
              label="Stream Name"
              value={newStream.name}
              onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
              placeholder="e.g. Web Development"
              required
            />
            <LabeledTextarea
              label="Description"
              value={newStream.description}
              onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
              placeholder="Brief description of the stream"
              required
            />
            <LabeledInput
              label="Duration (weeks)"
              type="number"
              value={newStream.duration}
              onChange={(e) => setNewStream({ ...newStream, duration: e.target.value })}
              placeholder="8"
              required
            />
            <LabeledSelect
              label="Status"
              value={newStream.status}
              onChange={(e) => setNewStream({ ...newStream, status: e.target.value })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Paused', label: 'Paused' },
              ]}
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

        <Modal
          isOpen={showCohortModal}
          onClose={() => setShowCohortModal(false)}
          title="Create New Cohort"
        >
          <form onSubmit={handleCreateCohort} className="space-y-4">
            <LabeledInput
              label="Cohort Name"
              value={newCohort.name}
              onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
              placeholder="e.g. Cohort 14"
              required
            />
            <LabeledSelect
              label="Assign Stream"
              value={newCohort.stream}
              onChange={(e) => setNewCohort({ ...newCohort, stream: e.target.value })}
              options={streams.map(s => ({ value: s.name, label: s.name }))}
              placeholder="Select a stream"
              required
            />
            <LabeledSelect
              label="Lead Instructor"
              value={newCohort.leadInstructor}
              onChange={(e) => setNewCohort({ ...newCohort, leadInstructor: e.target.value })}
              options={[
                { value: 'Daniel Okon', label: 'Daniel Okon' },
                { value: 'Emeka Adeyemi', label: 'Emeka Adeyemi' },
                { value: 'Chioma Nwosu', label: 'Chioma Nwosu' },
              ]}
              placeholder="Select instructor"
              required
            />
            <LabeledInput
              label="Start Date"
              type="date"
              value={newCohort.startDate}
              onChange={(e) => setNewCohort({ ...newCohort, startDate: e.target.value })}
              required
            />
            <LabeledInput
              label="End Date"
              type="date"
              value={newCohort.endDate}
              onChange={(e) => setNewCohort({ ...newCohort, endDate: e.target.value })}
              required
            />
            <LabeledSelect
              label="Status"
              value={newCohort.status}
              onChange={(e) => setNewCohort({ ...newCohort, status: e.target.value })}
              options={[
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Ongoing', label: 'Ongoing' },
                { value: 'Completed', label: 'Completed' },
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

        <Drawer
          isOpen={selectedCohort !== null}
          onClose={() => setSelectedCohort(null)}
          title={selectedCohort?.name || ''}
        >
          {selectedCohort && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Stream:</span> {selectedCohort.stream}</p>
                  <p className="text-sm"><span className="font-medium">Lead Instructor:</span> {selectedCohort.leadInstructor}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <StatusBadge status={selectedCohort.status} /></p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Dates</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Start:</span> {new Date(selectedCohort.startDate).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">End:</span> {new Date(selectedCohort.endDate).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(selectedCohort.attendanceRate * 100)}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedCohort.avgProgress}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Students Enrolled</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedCohort.studentsEnrolled}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Certificate Eligible</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedCohort.certificateEligible}%</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
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
