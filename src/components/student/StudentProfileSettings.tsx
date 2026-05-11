import React, { useEffect, useState } from 'react';
import { Mail, Save, UserCircle } from 'lucide-react';
import { Student } from '../../types';
import { profileService } from '../../services/profileService';

interface StudentProfileSettingsProps {
  student: Student;
  onStudentUpdated: (student: Student) => void;
}

const StudentProfileSettings: React.FC<StudentProfileSettingsProps> = ({ student, onStudentUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
    });
  }, [student]);

  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateMyProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });
      onStudentUpdated({
        ...student,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
      });
    } catch (err) {
      setError('Unable to save changes right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCircle className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Profile Details</h2>
          <p className="text-sm text-slate-500">Quick edit — for more options visit your Profile page.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm text-slate-600 font-semibold">
          First name
          <input
            value={formData.firstName}
            onChange={handleInputChange('firstName')}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="text-sm text-slate-600 font-semibold">
          Last name
          <input
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="text-sm text-slate-600 font-semibold md:col-span-2">
          Email
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">{formData.email}</span>
          </div>
        </label>
      </div>
      <div className="mt-6">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default StudentProfileSettings;
