import { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import PasswordInput from '../components/ui/PasswordInput';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';

export default function AccountPage() {
  const { adminUser, refreshProfile, updateProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const initialProfile = (p) => ({
    first_name: p?.first_name || '',
    middle_name: p?.middle_name || '',
    last_name: p?.last_name || '',
    gender: p?.gender || '',
    date_of_birth: p?.date_of_birth || '',
    country: p?.country || '',
    state_county: p?.state_county || '',
    city: p?.city || '',
    phone_country_code: p?.phone_country_code || '',
    phone_number: p?.phone_number || '',
    avatar_url: p?.avatar_url || '',
  });

  const [form, setForm] = useState(initialProfile(adminUser?.profile));

  useEffect(() => {
    // Refresh profile with default TTL so the page reflects recent updates
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  useEffect(() => {
    setForm(initialProfile(adminUser?.profile));
  }, [adminUser]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    (async () => {
      setSaving(true);
      setSaveError(null);
      try {
        const payload = { ...form };
        const res = await updateProfile(payload);
        if (!res?.success) {
          throw new Error(res?.error || 'Failed to update profile');
        }
        // Profile and adminUser are updated in context; optional hard refresh:
        await refreshProfile({ force: true });
        alert('Profile updated successfully');
      } catch (err) {
        setSaveError(err.message || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    alert('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <AdminLayout pageTitle="Admin Account">
      <div className="space-y-6">
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-3xl">
                  {adminUser?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">{adminUser?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-base font-medium text-gray-900">{adminUser?.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{adminUser?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-base text-gray-900">{adminUser?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-base text-gray-900">{adminUser?.profile?.updated_at || '—'}</p>
                </div>
                {adminUser?.profile && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-base text-gray-900">{adminUser.profile.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="text-base text-gray-900">{adminUser.profile.date_of_birth || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="text-base text-gray-900">{adminUser.profile.country || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="text-base text-gray-900">{adminUser.profile.city || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State / County</p>
                      <p className="text-base text-gray-900">{adminUser.profile.state_county || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avatar URL</p>
                      <p className="text-base text-gray-900 break-all">{adminUser.profile.avatar_url || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-600 mt-1">Update your personal details below</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledInput label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
              <LabeledInput label="Middle Name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
              <LabeledInput label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledSelect
                label="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <LabeledInput
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
              <LabeledInput label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledInput label="State / County" value={form.state_county} onChange={(e) => setForm({ ...form, state_county: e.target.value })} />
              <LabeledInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <LabeledInput label="Avatar URL" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LabeledInput label="Phone Country Code" value={form.phone_country_code} onChange={(e) => setForm({ ...form, phone_country_code: e.target.value })} />
              <LabeledInput label="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition text-sm font-medium"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Streams / Cohorts</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {adminUser?.assignedStreams?.map((stream, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                >
                  {stream}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Last Login Information</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Last login:</span>{' '}
              {adminUser?.lastLogin && new Date(adminUser.lastLogin).toLocaleString('en-NG', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}{' '}
              WAT from {adminUser?.location}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          <div className="p-6 space-y-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Update Password
                </button>
              </div>
            </form>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>
                <ToggleSwitch
                  enabled={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  label="Enable 2FA"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
