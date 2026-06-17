import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Lock, AlertTriangle, Save, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword, deleteAccount } from '../api';

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-border rounded-xl overflow-hidden mb-5">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
      <Icon size={15} className="text-text-muted" />
      <h2 className="text-sm font-semibold text-text-main">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i - 1);

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [whatsappOn, setWhatsappOn] = useState(user?.whatsapp_subscribed || false);

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      college: user?.college || '',
      branch: user?.branch || '',
      graduation_year: user?.graduation_year || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passErrors },
  } = useForm();

  const newPassword = watchPassword('newPassword', '');

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try {
      const res = await updateProfile({
        ...data,
        whatsapp_subscribed: whatsappOn,
        graduation_year: data.graduation_year ? parseInt(data.graduation_year) : null,
      });
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (data) => {
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      logout();
      navigate('/login');
    } catch {
      toast.error('Failed to delete account');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="ml-60 flex-1 p-8 min-w-0">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-text-main">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account and preferences</p>
        </div>

        <div className="max-w-2xl">
          {/* Profile */}
          <SectionCard title="Profile" icon={User}>
            <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name</label>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${profileErrors.name ? 'border-danger' : 'border-border'}`}
                  {...regProfile('name', { required: 'Name is required' })}
                />
                {profileErrors.name && <p className="text-xs text-danger mt-1">{profileErrors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">College</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    {...regProfile('college')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Branch</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    {...regProfile('branch')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Graduation Year</label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                    {...regProfile('graduation_year')}
                  >
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    {...regProfile('phone')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {savingProfile ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={13} /> Save Profile</>
                )}
              </button>
            </form>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" icon={Bell}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-main">Email Reminders</p>
                  <p className="text-xs text-text-muted mt-0.5">Receive reminders via email</p>
                </div>
                <div className="w-10 h-5.5 bg-success rounded-full relative cursor-default">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-main">WhatsApp Reminders</p>
                  <p className="text-xs text-text-muted mt-0.5">Requires a valid phone number</p>
                </div>
                <button
                  onClick={() => setWhatsappOn(!whatsappOn)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${whatsappOn ? 'bg-success' : 'bg-border'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${whatsappOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {whatsappOn && !user?.phone && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-warning">Add your phone number in the profile section above to enable WhatsApp reminders.</p>
                </div>
              )}

              {whatsappOn && (
                <button
                  onClick={() => handleProfileSubmit(onSaveProfile)()}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Save notification preferences →
                </button>
              )}
            </div>
          </SectionCard>

          {/* Password */}
          <SectionCard title="Change Password" icon={Lock}>
            <form onSubmit={handlePasswordSubmit(onSavePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Current Password</label>
                <input
                  type="password"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${passErrors.currentPassword ? 'border-danger' : 'border-border'}`}
                  {...regPassword('currentPassword', { required: 'Current password required' })}
                />
                {passErrors.currentPassword && <p className="text-xs text-danger mt-1">{passErrors.currentPassword.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">New Password</label>
                <input
                  type="password"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${passErrors.newPassword ? 'border-danger' : 'border-border'}`}
                  {...regPassword('newPassword', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                {passErrors.newPassword && <p className="text-xs text-danger mt-1">{passErrors.newPassword.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${passErrors.confirmPassword ? 'border-danger' : 'border-border'}`}
                  {...regPassword('confirmPassword', {
                    validate: (v) => v === newPassword || 'Passwords do not match',
                  })}
                />
                {passErrors.confirmPassword && <p className="text-xs text-danger mt-1">{passErrors.confirmPassword.message}</p>}
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {savingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </SectionCard>

          {/* Danger Zone */}
          <div className="bg-white border border-danger/20 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-danger/10 bg-red-50/50">
              <AlertTriangle size={15} className="text-danger" />
              <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-main">Delete Account</p>
                <p className="text-xs text-text-muted mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-danger border border-danger/20 rounded-lg hover:bg-red-50 transition-colors"
              >
                <AlertTriangle size={13} />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          description="Are you absolutely sure? This will permanently delete your account, all applications, resumes, and reminders. This action cannot be undone."
          confirmLabel="Yes, Delete My Account"
          loading={deleteLoading}
        />
      </main>
    </div>
  );
};

export default Settings;
