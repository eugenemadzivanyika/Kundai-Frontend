import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { authService } from '../services/api';

interface UserRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  studentId?: string | null;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState<Partial<UserRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createPayload, setCreatePayload] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student', studentId: '' });
  const [studentPayload, setStudentPayload] = useState({ id: '', firstName: '', lastName: '', email: '' });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: UserRow) => {
    setEditingUserId(u._id);
    setEditPayload({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, studentId: u.studentId || '' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditPayload({});
  };

  const saveEdit = async (id: string) => {
    setError(null);
    try {
      const payload = {
          ...editPayload,
          email: editPayload.email?.trim().toLowerCase()
      };
      
      await adminService.updateUser(id, payload as any);

    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
      ...createPayload,
      email: createPayload.email.trim().toLowerCase()
    };

    await adminService.createUser(payload as any);
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        const payload = {
          ...studentPayload,
          email: studentPayload.email.trim().toLowerCase()
      };
      await adminService.createStudent(payload as any);
      // no need to refresh users
    } catch (err: any) {
      setError(err?.message || 'Failed to create student');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4">
        <button className="bg-indigo-600 text-white px-3 py-2 rounded mr-2" onClick={() => navigate('/admin/courses')}>Manage Courses</button>
        <button className="bg-indigo-600 text-white px-3 py-2 rounded mr-2" onClick={() => navigate('/admin/students')}>Manage Students</button>
        <button className="bg-indigo-600 text-white px-3 py-2 rounded" onClick={() => navigate('/admin/resources')}>Manage Resources</button>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Users</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Student ID</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t">
                    {editingUserId === u._id ? (
                      <>
                        <td className="p-2">
                          <input className="p-1 border w-full" value={editPayload.firstName || ''} onChange={e => setEditPayload({ ...editPayload, firstName: e.target.value })} />
                          <input className="p-1 border w-full mt-1" value={editPayload.lastName || ''} onChange={e => setEditPayload({ ...editPayload, lastName: e.target.value })} />
                        </td>
                        <td className="p-2"><input className="p-1 border w-full" value={editPayload.email || ''} onChange={e => setEditPayload({ ...editPayload, email: e.target.value })} /></td>
                        <td className="p-2">
                          <select className="p-1 border w-full" value={editPayload.role || 'student'} onChange={e => setEditPayload({ ...editPayload, role: e.target.value })}>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-2"><input className="p-1 border w-full" value={editPayload.studentId || ''} onChange={e => setEditPayload({ ...editPayload, studentId: e.target.value })} /></td>
                        <td className="p-2 flex gap-2">
                          <button className="text-sm bg-green-600 text-white px-2 py-1 rounded" onClick={() => saveEdit(u._id)}>Save</button>
                          <button className="text-sm px-2 py-1 rounded border" onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{u.firstName} {u.lastName}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                        <td className="p-2">{u.studentId || '-'}</td>
                        <td className="p-2 flex gap-2">
                          <button className="text-sm px-2 py-1 rounded border" onClick={() => startEdit(u)}>Edit</button>
                          <button className="text-sm text-red-600" onClick={() => handleDelete(u._id)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Create User</h3>
          <form onSubmit={handleCreateUser} className="space-y-2">
            <input className="w-full p-2 border rounded" placeholder="First name" value={createPayload.firstName} onChange={e => setCreatePayload({...createPayload, firstName: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Last name" value={createPayload.lastName} onChange={e => setCreatePayload({...createPayload, lastName: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Email" value={createPayload.email} onChange={e => setCreatePayload({...createPayload, email: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Password" value={createPayload.password} onChange={e => setCreatePayload({...createPayload, password: e.target.value})} />
            <select className="w-full p-2 border rounded" value={createPayload.role} onChange={e => setCreatePayload({...createPayload, role: e.target.value})}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <input className="w-full p-2 border rounded" placeholder="Student ID (optional)" value={createPayload.studentId} onChange={e => setCreatePayload({...createPayload, studentId: e.target.value})} />
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Create</button>
          </form>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Create Student Record</h3>
          <form onSubmit={handleCreateStudent} className="space-y-2">
            <input className="w-full p-2 border rounded" placeholder="Student ID" value={studentPayload.id} onChange={e => setStudentPayload({...studentPayload, id: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="First name" value={studentPayload.firstName} onChange={e => setStudentPayload({...studentPayload, firstName: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Last name" value={studentPayload.lastName} onChange={e => setStudentPayload({...studentPayload, lastName: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Email" value={studentPayload.email} onChange={e => setStudentPayload({...studentPayload, email: e.target.value})} />
            <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Create Student</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
