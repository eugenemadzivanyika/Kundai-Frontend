import React, { useEffect, useState } from 'react';
import { resourceService } from '../services/api';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdminResources: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resourceService.getAllResources({ search, limit: 200 });
      setResources(data.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await resourceService.deleteResource(id);
      setResources(prev => prev.filter(r => r._id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete resource');
    }
  };

  const handleUpdateName = async (id: string) => {
    const newName = prompt('New name');
    if (!newName) return;
    try {
      await resourceService.updateResource(id, { name: newName });
      setResources(prev => prev.map(r => r._id === id ? { ...r, name: newName } : r));
    } catch (err: any) {
      setError(err?.message || 'Failed to update resource');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Resources</h1>

      <div className="mb-4">
        <button className="bg-indigo-600 text-white px-3 py-2 rounded mr-2" onClick={() => navigate('/admin')}>Back to Admin</button>
      </div>

      <div className="mb-4 flex gap-2">
        <input placeholder="Search resources" value={search} onChange={e => setSearch(e.target.value)} className="p-2 border rounded w-64" />
        <button onClick={fetchResources} className="bg-blue-600 text-white px-3 py-2 rounded">Search</button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Course</th>
                <th className="p-2">Type</th>
                <th className="p-2">Uploaded By</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.course?.name || '-'}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.uploadedBy?.firstName} {r.uploadedBy?.lastName}</td>
                  <td className="p-2">
                    <button className="text-sm text-blue-600 mr-3" onClick={() => handleUpdateName(r._id)}>Edit</button>
                    <button className="text-sm text-red-600" onClick={() => handleDelete(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
