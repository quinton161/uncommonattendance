import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { 
  Settings, 
  Shield, 
  Bell, 
  Clock,
  Users,
  Database,
  Mail,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Uncommon Attendance',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    language: 'en',
    
    // Attendance Settings
    checkInWindow: '30',
    lateThreshold: '15',
    autoMarkAbsent: true,
    allowEarlyCheckIn: false,
    requireLocation: false,
    
    // Security Settings
    passwordMinLength: '8',
    requireSpecialChars: true,
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    twoFactorAuth: false,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    attendanceAlerts: true,
    weeklyReports: true,
    systemMaintenance: true,
    
    // Email Settings
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@uncommon.edu',
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: '30',
    backupLocation: 'cloud'
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'attendance', name: 'Attendance', icon: Clock },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'backup', name: 'Backup', icon: Database }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 1000);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="System Name"
          value={settings.systemName}
          onChange={(e) => handleSettingChange('systemName', e.target.value)}
          helperText="The name displayed throughout the application"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSettingChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <select
            value={settings.timeFormat}
            onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="12">12 Hour</option>
            <option value="24">24 Hour</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAttendanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Check-in Window (minutes)"
          type="number"
          value={settings.checkInWindow}
          onChange={(e) => handleSettingChange('checkInWindow', e.target.value)}
          helperText="How long students have to check in"
        />
        <Input
          label="Late Threshold (minutes)"
          type="number"
          value={settings.lateThreshold}
          onChange={(e) => handleSettingChange('lateThreshold', e.target.value)}
          helperText="Minutes after which attendance is marked as late"
        />
      </div>
      
      <div className="space-y-4">
        {[
          { key: 'autoMarkAbsent', title: 'Auto Mark Absent', desc: 'Automatically mark students absent if they don\'t check in' },
          { key: 'allowEarlyCheckIn', title: 'Allow Early Check-in', desc: 'Let students check in before the official start time' },
          { key: 'requireLocation', title: 'Require Location', desc: 'Students must be within campus to check in' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Minimum Password Length"
          type="number"
          value={settings.passwordMinLength}
          onChange={(e) => handleSettingChange('passwordMinLength', e.target.value)}
        />
        <Input
          label="Session Timeout (minutes)"
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
        />
        <Input
          label="Max Login Attempts"
          type="number"
          value={settings.maxLoginAttempts}
          onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        {[
          { key: 'requireSpecialChars', title: 'Require Special Characters', desc: 'Passwords must contain special characters' },
          { key: 'twoFactorAuth', title: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', title: 'Email Notifications', desc: 'Send notifications via email' },
        { key: 'smsNotifications', title: 'SMS Notifications', desc: 'Send notifications via SMS' },
        { key: 'attendanceAlerts', title: 'Attendance Alerts', desc: 'Alert when students are absent' },
        { key: 'weeklyReports', title: 'Weekly Reports', desc: 'Send weekly attendance reports' },
        { key: 'systemMaintenance', title: 'System Maintenance', desc: 'Notify about system updates' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">{item.title}</h4>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[item.key]}
              onChange={(e) => handleSettingChange(item.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="SMTP Server"
          value={settings.smtpServer}
          onChange={(e) => handleSettingChange('smtpServer', e.target.value)}
        />
        <Input
          label="SMTP Port"
          type="number"
          value={settings.smtpPort}
          onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
        />
        <Input
          label="SMTP Username"
          value={settings.smtpUsername}
          onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
        />
        <div className="relative">
          <Input
            label="SMTP Password"
            type={showPassword ? "text" : "password"}
            value={settings.smtpPassword}
            onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>
        <Input
          label="From Email Address"
          type="email"
          value={settings.fromEmail}
          onChange={(e) => handleSettingChange('fromEmail', e.target.value)}
          className="md:col-span-2"
        />
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Backup Frequency
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <Input
          label="Retention Period (days)"
          type="number"
          value={settings.retentionPeriod}
          onChange={(e) => handleSettingChange('retentionPeriod', e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Backup Location
          </label>
          <select
            value={settings.backupLocation}
            onChange={(e) => handleSettingChange('backupLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="local">Local Storage</option>
            <option value="cloud">Cloud Storage</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Auto Backup</h4>
          <p className="text-sm text-gray-600">Automatically backup data based on frequency</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'attendance':
        return renderAttendanceSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'email':
        return renderEmailSettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="mt-2 text-gray-600">Configure system preferences and security settings</p>
              </div>
              <div className="flex items-center space-x-3">
                {saveStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Settings saved successfully</span>
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  loading={saveStatus === 'saving'}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Settings Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {tabs.find(tab => tab.id === activeTab)?.icon && (
                    <span className="mr-3">
                      {React.createElement(tabs.find(tab => tab.id === activeTab).icon, { className: "w-6 h-6" })}
                    </span>
                  )}
                  {tabs.find(tab => tab.id === activeTab)?.name} Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTabContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
