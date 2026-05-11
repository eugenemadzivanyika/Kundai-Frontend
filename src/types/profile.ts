// src/types/profile.ts

export interface TeacherProfileData {
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
  staffNumber?: string;
  teachingCouncilRegNumber?: string;
  employmentType?: string;
  position?: string;
  employmentStartDate?: string;
  spouseName?: string;
  spousePhone?: string;
  numberOfDependants?: number;
}

export interface StudentProfileData {
  gender?: string;
  dateOfBirth?: string;
  homeAddress?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  medicalConditions?: string;
  specialNeeds?: string;
  boardingStatus?: string;
  transportMode?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  guardianOccupation?: string;
  secondGuardianName?: string;
  secondGuardianPhone?: string;
  secondGuardianRelationship?: string;
}

/** Shape returned by GET /api/profile/me */
export interface Profile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  username?: string;
  role: string;
  avatarUrl?: string;
  teacherProfile?: TeacherProfileData;
  studentProfile?: StudentProfileData;
}

/** Fields accepted by PUT /api/profile/me */
export type ProfileUpdate = Pick<Profile, 'firstName' | 'lastName' | 'phoneNumber'> &
  TeacherProfileData &
  StudentProfileData;
