import { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Card from '../components/ui/Card';
import LabeledInput from '../components/ui/LabeledInput';
import LabeledSelect from '../components/ui/LabeledSelect';
import ToggleSwitch from '../components/ui/ToggleSwitch';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    academyName: 'Toko Academy',
    programBrand: 'TechForge Bootcamp',
    defaultCountryCode: '+234',
    defaultTimeZone: 'WAT',
    supportEmail: 'support@tokoacademy.org',
    minAttendanceForCertificate: '90',
    requireAllAssignmentsGraded: true,
    theme: 'light',
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <AdminLayout pageTitle="Settings">
      <div className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Organization Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <LabeledInput
                label="Academy Name"
                value={settings.academyName}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
              />
              <LabeledInput
                label="Program Brand Name"
                value={settings.programBrand}
                onChange={(e) => setSettings({ ...settings, programBrand: e.target.value })}
              />
              <LabeledInput
                label="Default Country Code for Phone"
                value={settings.defaultCountryCode}
                onChange={(e) => setSettings({ ...settings, defaultCountryCode: e.target.value })}
              />
              <LabeledInput
                label="Default Time Zone"
                value={settings.defaultTimeZone}
                onChange={(e) => setSettings({ ...settings, defaultTimeZone: e.target.value })}
              />
              <LabeledInput
                label="Support Email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Policy</h3>
            </div>
            <div className="p-6">
              <LabeledInput
                label="Minimum Attendance % Required for Certificate"
                type="number"
                value={settings.minAttendanceForCertificate}
                onChange={(e) => setSettings({ ...settings, minAttendanceForCertificate: e.target.value })}
                placeholder="90"
              />
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assignment Policy</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">All Core Assignments Must Be Graded</p>
                  <p className="text-xs text-gray-600 mt-1">Require all assignments to be graded before certificate can be issued</p>
                </div>
                <ToggleSwitch
                  enabled={settings.requireAllAssignmentsGraded}
                  onChange={(value) => setSettings({ ...settings, requireAllAssignmentsGraded: value })}
                  label="Require all assignments graded"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">UI Theme</h3>
            </div>
            <div className="p-6">
              <LabeledSelect
                label="Admin Portal Theme"
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                options={[
                  { value: 'light', label: 'Light Mode' },
                  { value: 'dark', label: 'Dark Mode' },
                ]}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
