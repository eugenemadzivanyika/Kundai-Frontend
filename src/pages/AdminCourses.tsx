import React, { useEffect, useState } from 'react';
import { courseService, adminService } from '../services/api';
import { Course } from '../types';
import { useNavigate } from 'react-router-dom';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: '', code: '', description: '' });
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourses();
      setCourses(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const u = await adminService.getUsers();
      setUsers(u || []);
    } catch (err) {
      // non-fatal
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await courseService.createCourse(formState as any);
      setFormState({ name: '', code: '', description: '' });
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create course');
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course._id);
    setFormState({ name: course.name || '', code: course.code || '', description: (course as any).description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormState({ name: '', code: '', description: '' });
  };

  const saveEdit = async (id: string) => {
    setError(null);
    try {
      await courseService.updateCourse(id, formState as any);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update course');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await courseService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c._id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete course');
    }
  };

  const handleAssignStudent = async (courseId: string) => {
    setError(null);
    try {
      await courseService.assignStudentToCourse(courseId, assignStudentId);
      setAssignStudentId('');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign student');
    }
  };

  const handleAssignTeacher = async (courseId: string) => {
    setError(null);
    try {
      await courseService.assignTeacherToCourse(courseId, assignTeacherId);
      setAssignTeacherId('');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign teacher');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Course Management</h1>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <section className="mb-6">
        <h2 className="font-medium mb-2">Create Course</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="p-2 border rounded" placeholder="Name" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
          <input className="p-2 border rounded" placeholder="Code" value={formState.code} onChange={e => setFormState({...formState, code: e.target.value})} />
          <input className="p-2 border rounded" placeholder="Description" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-2">Courses</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Teacher</th>
                  <th className="p-2">Students</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c._id} className="border-t">
                    <td className="p-2">
                      {editingId === c._id ? (
                        <input className="p-1 border rounded w-full" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === c._id ? (
                        <input className="p-1 border rounded w-full" value={formState.code} onChange={e => setFormState({...formState, code: e.target.value})} />
                      ) : (
                        c.code
                      )}
                    </td>
                    <td className="p-2">{(c as any).teacher?.firstName ? `${(c as any).teacher.firstName} ${(c as any).teacher.lastName}` : ((c as any).teacher?.email || '-')}</td>
                    <td className="p-2">{(c as any).students ? (c as any).students.length : 0}</td>
                    <td className="p-2">
                      {editingId === c._id ? (
                        <>
                          <button className="mr-2 text-sm bg-green-600 text-white px-2 py-1 rounded" onClick={() => saveEdit(c._id)}>Save</button>
                          <button className="text-sm bg-gray-300 px-2 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="mr-2 text-sm text-blue-600" onClick={() => startEdit(c)}>Edit</button>
                          <button className="mr-2 text-sm text-red-600" onClick={() => handleDelete(c._id)}>Delete</button>
                          <div className="mt-2">
                            <input className="p-1 border rounded mr-2" placeholder="Student ID" value={assignStudentId} onChange={e => setAssignStudentId(e.target.value)} />
                            <button className="text-sm bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleAssignStudent(c._id)}>Assign Student</button>
                          </div>
                          <div className="mt-2">
                            <select value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)} className="p-1 border rounded mr-2">
                              <option value="">--Assign Teacher--</option>
                              {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => (
                                <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                              ))}
                            </select>
                            <button className="text-sm bg-indigo-600 text-white px-2 py-1 rounded" onClick={() => handleAssignTeacher(c._id)}>Assign</button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCourses;
