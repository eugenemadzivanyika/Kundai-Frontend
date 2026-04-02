import React, { useEffect, useState } from 'react';
import { adminService, studentService, courseService, assessmentService, developmentService } from '../services/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Student = unknown; // lightweight typing to avoid large refactor here
type Course = unknown;
type StudentPlan = unknown;
type Result = unknown;

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [editingPlanTemplateId, setEditingPlanTemplateId] = useState<string | null>(null);
  const [planTemplate, setPlanTemplate] = useState<any | null>(null);
  const [templateSteps, setTemplateSteps] = useState<any[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planEditPayload, setPlanEditPayload] = useState<{ currentProgress?: number; status?: string; completionDate?: string }>({});
  const [assignPlanPayload, setAssignPlanPayload] = useState({ planId: '', courseId: '', setActive: false });
  const [newResultPayload, setNewResultPayload] = useState({ assessmentId: '', expectedMark: 0, actualMark: 0, grade: '', feedback: '' });

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const s = await studentService.getStudents();
      setStudents(s || []);
      const c = await courseService.getCourses();
      setCourses(c || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openStudent(idOrStudent: string | Student) {
    const id = typeof idOrStudent === 'string' ? idOrStudent : (idOrStudent as any)._id || (idOrStudent as any).id;
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminService.getStudent(id);
      // shape: { student, results }
      setSelected(res.student || res);
      setResults(res.results || []);
      // load student plans too
      const sp = await adminService.listStudentPlans(id);
      setPlans(sp || []);

      // load assessments for the student's first course (if any)
      try {
        const studentObj: any = res.student || res;
        const firstCourse = (studentObj.courses && studentObj.courses[0]) ? (studentObj.courses[0]._id || studentObj.courses[0]) : null;
        if (firstCourse) {
          const a = await assessmentService.getAssessmentsByCourseId(firstCourse);
          setAssessments(a || []);
        } else {
          setAssessments([]);
        }
      } catch {
        setAssessments([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load student');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!selected) return;
    setSaving(true);
    try {
      await adminService.updateStudent((selected as any)._id || (selected as any).id, selected);
      alert('Profile saved');
      // refresh the list
      const s = await studentService.getStudents();
      setStudents(s || []);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function enrollStudent() {
    if (!selected || !enrollCourseId) return alert('Select course to enroll');
    try {
      await adminService.enrollStudent((selected as any)._id || (selected as any).id, enrollCourseId);
      await openStudent((selected as any)._id || (selected as any).id);
      setEnrollCourseId('');
      alert('Enrolled');
    } catch (err) {
      console.error(err);
      alert('Enroll failed');
    }
  }

  async function unenrollStudent(courseId: string) {
    if (!selected) return;
    try {
      await adminService.unenrollStudent((selected as any)._id || (selected as any).id, courseId);
      await openStudent((selected as any)._id || (selected as any).id);
      alert('Unenrolled');
    } catch (err) {
      console.error(err);
      alert('Unenroll failed');
    }
  }

  async function handleAssignPlan() {
    if (!selected || !assignPlanPayload.planId || !assignPlanPayload.courseId) return alert('Provide planId and courseId');
    try {
      await adminService.assignPlanToStudent((selected as any)._id || (selected as any).id, assignPlanPayload);
      const sp = await adminService.listStudentPlans((selected as any)._id || (selected as any).id);
      setPlans(sp || []);
      if (assignPlanPayload.setActive) {
        await openStudent((selected as any)._id || (selected as any).id);
      }
      setAssignPlanPayload({ planId: '', courseId: '', setActive: false });
      alert('Plan assigned');
    } catch (err) {
      console.error(err);
      alert('Assign plan failed');
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!selected) return;
    if (!confirm('Delete this student plan?')) return;
    try {
      await adminService.deleteStudentPlan((selected as any)._id || (selected as any).id, planId);
      const sp = await adminService.listStudentPlans((selected as any)._id || (selected as any).id);
      setPlans(sp || []);
      alert('Plan deleted');
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  }

  // Plan template editing
  async function loadPlanTemplate(planId: string) {
    try {
      const p = await developmentService.getPlanById(planId);
      setPlanTemplate(p);
      setTemplateSteps(p.steps || []);
      setEditingPlanTemplateId(planId);
    } catch (err) {
      console.error(err);
      alert('Failed to load plan template');
    }
  }

  function addTemplateStep() {
    setTemplateSteps(prev => [...prev, { title: 'New step', type: 'video', link: '', order: prev.length + 1 }]);
  }

  function updateTemplateStep(index: number, updates: Partial<any>) {
    setTemplateSteps(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }

  function removeTemplateStep(index: number) {
    setTemplateSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  async function savePlanTemplate() {
    if (!editingPlanTemplateId || !planTemplate) return;
    try {
      const updates = { steps: templateSteps };
      const updated = await developmentService.updateCoursePlan(editingPlanTemplateId, updates);
      setPlanTemplate(updated);
      setTemplateSteps(updated.steps || []);
      setEditingPlanTemplateId(null);
      alert('Plan template updated');
    } catch (err) {
      console.error(err);
      alert('Failed to save plan template');
    }
  }

  async function handleCreateResult() {
    if (!selected) return;
    try {
      await adminService.createResultForStudent((selected as any)._id || (selected as any).id, newResultPayload);
      const res = await adminService.getStudent((selected as any)._id || (selected as any).id);
      setResults(res.results || []);
      setNewResultPayload({ assessmentId: '', expectedMark: 0, actualMark: 0, grade: '', feedback: '' });
      alert('Result created');
    } catch (err) {
      console.error(err);
      alert('Create result failed');
    }
  }

  async function handleUpdateResult(resultId: string, updates: Partial<Result>) {
    if (!selected) return;
    try {
      await adminService.updateResultForStudent((selected as any)._id || (selected as any).id, resultId, updates);
      const res = await adminService.getStudent((selected as any)._id || (selected as any).id);
      setResults(res.results || []);
      alert('Result updated');
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  }

  async function handleDeleteResult(resultId: string) {
    if (!selected) return;
    if (!confirm('Delete this result?')) return;
    try {
      await adminService.deleteResultForStudent((selected as any)._id || (selected as any).id, resultId);
      const res = await adminService.getStudent((selected as any)._id || (selected as any).id);
      setResults(res.results || []);
      alert('Result deleted');
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    const ss: any = s;
    return (ss.firstName || '').toLowerCase().includes(q) || (ss.lastName || '').toLowerCase().includes(q) || (ss.email || '').toLowerCase().includes(q) || (ss.id || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin — Students</h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} className="p-2 border rounded w-full" placeholder="Search students..." />
            <button className="btn" onClick={() => loadInitial()}>Refresh</button>
          </div>

          <div className="overflow-auto border rounded h-[60vh] p-2">
            {loading ? <div>Loading...</div> : (
              filteredStudents.map(s => {
                const ss: any = s;
                return (
                <div key={ss._id || ss.id} className="p-2 border-b hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{ss.firstName} {ss.lastName}</div>
                    <div className="text-sm text-gray-600">{ss.email} — {ss.id}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm" onClick={() => openStudent(s)}>Edit</button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-2">
          {!selected ? (
            <div>Select a student to view details</div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="text-xl">Profile</h3>
                <div className="mt-2 text-sm text-gray-600">Below are editable account and student profile fields. Fields marked <span className="font-semibold">(User)</span> come from the linked user account; fields marked <span className="font-semibold">(Student)</span> are stored on the student record.</div>

                {/* IDs / metadata row */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>Student ID: <span className="font-medium text-slate-700">{(selected as any).id || (selected as any)._id || '-'}</span></div>
                  <div>Linked User: <span className="font-medium text-slate-700">{(selected as any).userId || (selected as any).user || (selected as any).accountId || '-'}</span></div>
                  <div>Created: <span className="font-medium text-slate-700">{(selected as any).createdAt ? new Date((selected as any).createdAt).toLocaleString() : '-'}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Left: User / Account fields */}
                  <div>
                    <div className="text-sm font-medium mb-2">Account (User)</div>
                    <label className="block text-xs text-gray-600">First name <span className="text-xxs text-gray-400">(User)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).firstName || ''} onChange={e => setSelected({ ...(selected as any), firstName: e.target.value })} title="This comes from the linked User account" />

                    <label className="block text-xs text-gray-600 mt-2">Last name <span className="text-xxs text-gray-400">(User)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).lastName || ''} onChange={e => setSelected({ ...(selected as any), lastName: e.target.value })} />

                    <label className="block text-xs text-gray-600 mt-2">Email <span className="text-xxs text-gray-400">(User)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).email || ''} onChange={e => setSelected({ ...(selected as any), email: e.target.value })} />
                    <div className="text-xs text-gray-500 mt-1">Changing these edits the linked User account values.</div>
                  </div>

                  {/* Right: Student-specific profile fields */}
                  <div>
                    <div className="text-sm font-medium mb-2">Student profile</div>
                    <label className="block text-xs text-gray-600">Overall score <span className="text-xxs text-gray-400">(Student)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).overall ?? ''} onChange={e => setSelected({ ...(selected as any), overall: Number((e.target as HTMLInputElement).value) })} placeholder="Overall (0-100)" title="Student aggregate score stored on the Student record" />

                    <label className="block text-xs text-gray-600 mt-2">Engagement <span className="text-xxs text-gray-400">(Student)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).engagement || ''} onChange={e => setSelected({ ...(selected as any), engagement: e.target.value })} />

                    <label className="block text-xs text-gray-600 mt-2">Strengths <span className="text-xxs text-gray-400">(Student)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).strength || ''} onChange={e => setSelected({ ...(selected as any), strength: e.target.value })} />

                    <label className="block text-xs text-gray-600 mt-2">Performance notes <span className="text-xxs text-gray-400">(Student)</span></label>
                    <input className="p-2 border w-full" value={(selected as any).performance || ''} onChange={e => setSelected({ ...(selected as any), performance: e.target.value })} />
                  </div>
                </div>

                <div className="mt-3">
                  <button className="btn bg-blue-600 text-white px-3 py-1 rounded" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="text-lg">Enrolled Courses</h3>
                <div className="mt-2 space-y-2">
                  {((selected as any).courses || []).map((c: any) => (
                    <div key={(c && (c._id || c)) || Math.random()} className="flex items-center justify-between p-2 border rounded">
                      <div>{(c && (c.name || c.code)) || String(c)}</div>
                      <div>
                        <button className="btn btn-sm" onClick={() => unenrollStudent((c && (c._id || c)) || c)}>Unenroll</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <select value={enrollCourseId} onChange={e => setEnrollCourseId(e.target.value)} className="p-2 border w-2/3">
                    <option value="">-- select course to enroll --</option>
                    {courses.map((c: any) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
                  </select>
                  <button className="btn" onClick={enrollStudent}>Enroll</button>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="text-lg">Plans</h3>
                <div className="mt-2 space-y-2">
                  {plans.map((p: any) => (
                    <div key={(p as any)?._id} className="p-2 border rounded">
                      {!editingPlanId || editingPlanId !== (p as any)?._id ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{(p as any)?.plan?.name || (p as any)?.plan}</div>
                            <div className="text-sm text-gray-600">Status: {(p as any)?.status} — Progress: {(p as any)?.currentProgress}%</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-sm" onClick={() => {
                              // start editing
                              setEditingPlanId((p as any)?._id);
                              setPlanEditPayload({ currentProgress: (p as any)?.currentProgress, status: (p as any)?.status, completionDate: (p as any)?.completionDate ? new Date((p as any).completionDate).toISOString().slice(0,10) : '' });
                            }}>Edit</button>
                            <button className="btn btn-sm" onClick={() => loadPlanTemplate((p as any)?.plan?._id || (p as any)?.plan)}>Edit Steps</button>
                            <button className="btn btn-sm text-red-600" onClick={() => handleDeletePlan((p as any)?._id)}>Delete</button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 items-end">
                          <div className="col-span-2">
                            <div className="text-sm font-medium">{(p as any)?.plan?.name || (p as any)?.plan}</div>
                            <div className="text-xs text-gray-500">Edit details below</div>
                          </div>
                          <input type="number" min={0} max={100} className="p-1 border" value={planEditPayload.currentProgress ?? ''} onChange={e => setPlanEditPayload({ ...planEditPayload, currentProgress: Number(e.target.value) })} placeholder="Progress %" />
                          <select className="p-1 border" value={planEditPayload.status || ''} onChange={e => setPlanEditPayload({ ...planEditPayload, status: e.target.value })}>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <input type="date" className="p-1 border col-span-1" value={planEditPayload.completionDate || ''} onChange={e => setPlanEditPayload({ ...planEditPayload, completionDate: e.target.value })} />
                          <div className="col-span-4 flex gap-2 mt-2">
                            <button className="btn bg-green-600 text-white btn-sm px-3 py-1" onClick={async () => {
                              try {
                                await adminService.updateStudentPlan((selected as any)?._id || (selected as any)?.id, (p as any)?._id, {
                                  currentProgress: planEditPayload.currentProgress,
                                  status: planEditPayload.status,
                                  completionDate: planEditPayload.completionDate || undefined
                                });
                                const sp = await adminService.listStudentPlans((selected as any)?._id || (selected as any)?.id);
                                setPlans(sp || []);
                                setEditingPlanId(null);
                                alert('Plan updated');
                              } catch (err) {
                                console.error(err);
                                alert('Update failed');
                              }
                            }}>Save</button>
                            <button className="btn btn-sm" onClick={() => { setEditingPlanId(null); setPlanEditPayload({}); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                        {editingPlanTemplateId && planTemplate && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium">Editing Plan Template: {(planTemplate && planTemplate.name) || ''}</h4>
                            <div className="space-y-2 mt-2">
                              {templateSteps.map((st, idx) => (
                                <div key={idx} className="grid grid-cols-8 gap-2 items-center">
                                  <input className="p-1 border col-span-3" value={st.title || ''} onChange={e => updateTemplateStep(idx, { title: e.target.value })} />
                                  <select className="p-1 border col-span-1" value={st.type || 'video'} onChange={e => updateTemplateStep(idx, { type: e.target.value })}>
                                    <option value="video">video</option>
                                    <option value="document">document</option>
                                    <option value="assignment">assignment</option>
                                    <option value="quiz">quiz</option>
                                    <option value="discussion">discussion</option>
                                  </select>
                                  <input className="p-1 border col-span-3" value={st.link || ''} onChange={e => updateTemplateStep(idx, { link: e.target.value })} />
                                  <button className="btn btn-sm text-red-600" onClick={() => removeTemplateStep(idx)}>Remove</button>
                                </div>
                              ))}
                              <div className="flex gap-2 mt-2">
                                <button className="btn" onClick={addTemplateStep}>Add step</button>
                                <button className="btn bg-green-600 text-white" onClick={savePlanTemplate}>Save template</button>
                                <button className="btn" onClick={() => { setEditingPlanTemplateId(null); setPlanTemplate(null); setTemplateSteps([]); }}>Cancel</button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <input placeholder="PlanId" value={assignPlanPayload.planId} onChange={e => setAssignPlanPayload({ ...assignPlanPayload, planId: e.target.value })} className="p-2 border" />
                  <select value={assignPlanPayload.courseId} onChange={e => setAssignPlanPayload({ ...assignPlanPayload, courseId: e.target.value })} className="p-2 border">
                    <option value="">Select course</option>
                    {((selected as any).courses || []).map((c: any) => (
                      <option key={(c && (c._id || c)) || Math.random()} value={(c && (c._id || c)) || c}>{(c && (c.code || c.name)) || String(c)}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={assignPlanPayload.setActive} onChange={e => setAssignPlanPayload({ ...assignPlanPayload, setActive: e.target.checked })} /> Set active</label>
                    <button className="btn" onClick={handleAssignPlan}>Assign</button>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="text-lg">Results</h3>
                <div className="mt-2 space-y-2">
                  {results.map((r: any) => (
                    <div key={r._id} className="p-2 border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{r.assessment?.name || r.assessment}</div>
                          <div className="text-sm text-gray-600">Mark: {r.actualMark}/{r.expectedMark} — Grade: {r.grade}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-sm" onClick={() => {
                            const newMark = prompt('New actual mark', String(r.actualMark));
                            if (newMark != null) {
                              handleUpdateResult(r._id, { actualMark: Number(newMark) });
                            }
                          }}>Edit</button>
                          <button className="btn btn-sm text-red-600" onClick={() => handleDeleteResult(r._id)}>Delete</button>
                        </div>
                      </div>
                      {r.feedback && <div className="mt-1 text-sm">Feedback: {r.feedback}</div>}
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <select value={newResultPayload.assessmentId} onChange={e => setNewResultPayload({ ...newResultPayload, assessmentId: e.target.value })} className="p-2 border col-span-2">
                    <option value="">Select assessment</option>
                    {assessments.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                  <input type="number" className="p-2 border" value={newResultPayload.expectedMark} onChange={e => setNewResultPayload({ ...newResultPayload, expectedMark: Number(e.target.value) })} placeholder="Expected" />
                  <input type="number" className="p-2 border" value={newResultPayload.actualMark} onChange={e => setNewResultPayload({ ...newResultPayload, actualMark: Number(e.target.value) })} placeholder="Actual" />
                  <input className="p-2 border" value={newResultPayload.grade} onChange={e => setNewResultPayload({ ...newResultPayload, grade: e.target.value })} placeholder="Grade" />
                  <input className="p-2 border col-span-3" value={newResultPayload.feedback} onChange={e => setNewResultPayload({ ...newResultPayload, feedback: e.target.value })} placeholder="Feedback" />
                  <div>
                    <button className="btn" onClick={handleCreateResult}>Create Result</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
