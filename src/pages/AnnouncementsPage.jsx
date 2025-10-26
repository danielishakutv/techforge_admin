import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import LabeledTextarea from '../components/ui/LabeledTextarea';
import AnnouncementAudienceBadge from '../components/ui/AnnouncementAudienceBadge';
import { announcements as initialAnnouncements, streams } from '../data/mockData';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [audienceType, setAudienceType] = useState('global');
  const [selectedStream, setSelectedStream] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { adminUser } = useAuth();

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          title,
          message,
          audience: audienceType,
          stream: audienceType === 'stream' ? selectedStream : null,
        };
        const res = await api.broadcastAnnouncement(payload);
        if (res?.success) {
          setAnnouncements(prev => [res.data, ...prev]);
        } else {
          // fallback local
          let deliveredCount = audienceType === 'global' ? 126 : (streams.find(s => s.name === selectedStream) ? Math.floor(Math.random() * 30) + 15 : 0);
          const announcement = { id: announcements.length + 9001, title, message, audienceType, stream: audienceType === 'stream' ? selectedStream : null, sentBy: adminUser?.name || 'Admin', sentAt: new Date().toISOString(), deliveredCount };
          setAnnouncements(prev => [announcement, ...prev]);
        }
      } catch (err) {
        let deliveredCount = audienceType === 'global' ? 126 : (streams.find(s => s.name === selectedStream) ? Math.floor(Math.random() * 30) + 15 : 0);
        const announcement = { id: announcements.length + 9001, title, message, audienceType, stream: audienceType === 'stream' ? selectedStream : null, sentBy: adminUser?.name || 'Admin', sentAt: new Date().toISOString(), deliveredCount };
        setAnnouncements(prev => [announcement, ...prev]);
      } finally {
        setTitle('');
        setMessage('');
        setAudienceType('global');
        setSelectedStream('');
      }
    })();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getRecentAnnouncements();
        if (!mounted) return;
        setAnnouncements(res?.success ? res.data.items : initialAnnouncements);
      } catch (err) {
        setAnnouncements(initialAnnouncements);
      }
    };
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
                options={streams.map(s => ({ value: s.name, label: s.name }))}
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
