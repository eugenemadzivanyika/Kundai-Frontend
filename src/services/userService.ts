import { fetchData } from './apiClient';

interface StudentProfileFields {
  form?: number;
  gender?: string;
  dateOfBirth?: string;
  homeAddress?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  previousSchool?: string;
  admissionDate?: string;
  classGroupId?: string;
}

interface TeacherProfileFields {
  gender?: string;
  dateOfBirth?: string;
  nationalId?: string;
  maritalStatus?: string;
  homeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  qualifications?: string;
  teachingCertificate?: string;
  yearsOfExperience?: number;
  department?: string;
  classTeacherOf?: string;
  subjectAssignments?: { subject: string; subjectName?: string; classes: string[] }[];
}

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username?: string;
  password: string;
  roleCodes: string[];
  active?: boolean;
} & StudentProfileFields & TeacherProfileFields;

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;
  roleCodes?: string[];
  active?: boolean;
} & StudentProfileFields & TeacherProfileFields;

export const userService = {
  getUsers: (params?: { classId?: string }): Promise<any[]> => {
    const qs = params?.classId ? `?classId=${encodeURIComponent(params.classId)}` : '';
    return fetchData(`/admin/users${qs}`);
  },

  createUser: (data: CreateUserPayload): Promise<any> =>
    fetchData('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: string, data: UpdateUserPayload): Promise<any> =>
    fetchData(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteUser: (id: string): Promise<any> =>
    fetchData(`/admin/users/${id}`, { method: 'DELETE' }),

  getTeacherProfile: (userId: string): Promise<any> =>
    fetchData(`/admin/users/${userId}/teacher-profile`),

  updateTeacherProfile: (userId: string, data: TeacherProfileFields): Promise<any> =>
    fetchData(`/admin/users/${userId}/teacher-profile`, { method: 'PUT', body: JSON.stringify(data) }),
};
