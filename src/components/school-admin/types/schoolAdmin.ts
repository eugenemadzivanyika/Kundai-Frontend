// Shared TypeScript interfaces for school-admin pages, matching adminController.js DTO shapes.

export interface ClassRef {
  _id: string;
  name: string;
  form?: number;
  stream?: string;
}

export interface SubjectRef {
  _id?: string;
  name?: string;
  code?: string;
}

export interface SubjectAssignment {
  subject: SubjectRef | string;
  classes: (ClassRef | string)[];
}

export interface TeacherProfile {
  _id: string;
  gender: string;
  dateOfBirth?: string | null;
  nationalId: string;
  maritalStatus: string;
  homeAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  qualifications: string;
  teachingCertificate: string;
  yearsOfExperience: number;
  department: string;
  staffNumber?: string;
  position?: string;
  classTeacherOf?: ClassRef | null;
  subjectAssignments: SubjectAssignment[];
}

export interface StudentProfile {
  _id: string;
  id: string;
  form?: number;
  gender: string;
  dateOfBirth?: string | null;
  homeAddress: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  previousSchool: string;
  admissionDate?: string | null;
  classGroup?: ClassRef | string | null;
  overall: number;
}

export interface TeacherUser {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  roles: string[];
  role?: string;
  active: boolean;
  createdAt?: string;
  teacherProfile?: TeacherProfile;
}

export interface StudentUser {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  roles: string[];
  role?: string;
  active: boolean;
  createdAt?: string;
  studentProfile?: StudentProfile;
}

export interface SyllabusFile {
  name: string;
  url: string;
  size: number;
  uploadedAt?: string;
}

export interface SubjectTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface SubjectClassGroup {
  id: string;
  name: string;
  form?: number;
  stream?: string;
}

export interface SubjectRow {
  id: string;
  code: string;
  name: string;
  examBoardCode: string;
  description: string;
  grades: string[];
  teachers: string[];
  teachersList?: SubjectTeacher[];
  classGroupsList?: SubjectClassGroup[];
  active: boolean;
  syllabusFile: SyllabusFile | null;
  subjectResources?: any[];
  topicCount?: number;
}

export interface ClassRow {
  id: string;
  name: string;
  gradeLevel?: string;
  stream?: string;
  capacity?: number;
  studentCount?: number;
  classTeacher?: TeacherUser | null;
}
