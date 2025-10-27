import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import LabeledTextarea from '../components/ui/LabeledTextarea';
import AnnouncementAudienceBadge from '../components/ui/AnnouncementAudienceBadge';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [audienceType, setAudienceType] = useState('global');
  const [selectedStream, setSelectedStream] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { adminUser } = useAuth();

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          title,
          message,
          audienceType,
          stream: audienceType === 'stream' ? selectedStream : null,
        };
        const resp = await api.broadcastAnnouncement(payload);
        if (resp && resp.success) {
          const aResp = await api.getRecentAnnouncements();
          setAnnouncements((aResp && aResp.success && aResp.data.items) || []);
          setTitle('');
          setMessage('');
          setAudienceType('global');
          setSelectedStream('');
        } else {
          console.error('Failed to send announcement', resp && resp.error);
          alert('Failed to send announcement');
        }
      } catch (err) {
        console.error('Send announcement error', err);
        alert('Failed to send announcement');
      }
    })();
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
  const [aResp, sResp] = await Promise.all([api.getRecentAnnouncements().catch(() => null), api.getStreams().catch(() => null)]);
        if (!mounted) return;
  setAnnouncements((aResp && aResp.success && aResp.data.items) || []);
  setStreams((sResp && sResp.success && Array.isArray(sResp.data) ? sResp.data : []) || []);
      } catch (err) {
        console.error('Failed to load announcements', err);
        setError(err.message || 'Failed to load announcements');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const announcementColumns = [
    {
      header: 'Title',
      accessor: 'title',
    },
    {
      header: 'Audience',
      render: (row) => <AnnouncementAudienceBadge audienceType={row.audienceType} stream={row.stream} />,
    },
    {
      header: 'Sent By',
      accessor: 'sentBy',
    },
    {
      header: 'Sent At',
      render: (row) => {
        const date = new Date(row.sentAt);
        return (
          <div>
            <p className="text-sm">{date.toLocaleDateString('en-NG')}</p>
            <p className="text-xs text-gray-500">{date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} WAT</p>
          </div>
        );
      },
    },
    {
      header: 'Delivered Count',
      render: (row) => `${row.deliveredCount} students reached`,
    },
  ];

  return (
    <AdminLayout pageTitle="Announcements">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Send Announcement</h3>
            <p className="text-sm text-gray-600 mt-1">Broadcast messages to students via email and in-app notifications</p>
          </div>
          <form onSubmit={handleSendAnnouncement} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audience Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="global"
                    checked={audienceType === 'global'}
                    onChange={(e) => {
                      setAudienceType(e.target.value);
                      setSelectedStream('');
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">All Active Students (General)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="stream"
                    checked={audienceType === 'stream'}
                    onChange={(e) => setAudienceType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Specific Course / Stream Only</span>
                </label>
              </div>
            </div>

            {audienceType === 'stream' && (
              <LabeledSelect
                label="Select Stream"
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                options={streams.map(s => ({ value: s.title, label: s.title }))}
                placeholder="Choose a stream"
                required
              />
            )}

            <LabeledInput
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Class starts 10:30 AM tomorrow"
              required
            />

            <LabeledTextarea
              label="Message Body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your announcement message here..."
              required
              rows={5}
            />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Send Announcement
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recently Sent</h3>
          </div>
          <DataTable columns={announcementColumns} data={announcements} />
        </Card>
      </div>
    </AdminLayout>
  );
}
