import { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import PasswordInput from '../components/ui/PasswordInput';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';

export default function AccountPage() {
  const { adminUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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
              </div>
            </div>
          </div>
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
