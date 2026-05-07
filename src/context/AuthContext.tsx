import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ClassGroup {
  _id: string;
  name: string;
  form: number;
  stream: string;
}

interface Course {
  id: string;
  _id?: string;
  code: string;
  name: string;
  form?: number;
  classGroups?: ClassGroup[];
}

interface AuthContextType {
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  selectedClassGroups: string[];
  setSelectedClassGroups: (ids: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedClassGroups, setSelectedClassGroups] = useState<string[]>([]);

  return (
    <AuthContext.Provider value={{ selectedCourse, setSelectedCourse, selectedClassGroups, setSelectedClassGroups }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
