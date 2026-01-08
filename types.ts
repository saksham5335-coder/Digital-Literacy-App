export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export enum Subject {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  FRENCH = 'French'
}

export enum Grade {
  GRADE_6 = '6',
  GRADE_7 = '7',
  GRADE_8 = '8'
}

export enum DeviceType {
  PHONE = 'PHONE',
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP'
}

export interface TeachingAssignment {
  grade: Grade;
  section: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  grade?: Grade;
  section?: string;
  points: number;
  password?: string;
  recoveryEmail?: string;
  badges: string[];
  titles: string[];
  lastActive: string;
  // Teacher-specific fields
  teachingSubjects?: Subject[];
  teachingAssignments?: TeachingAssignment[];
}

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ScoreUpdate {
  userId: string;
  gameType: string;
  pointsEarned: number;
  grade: Grade;
  subject: Subject;
  timestamp: string;
}

export interface SubjectMastery {
  subject: Subject;
  avgScore: number;
  attempts: number;
}
