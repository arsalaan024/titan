
export type UserRole = 'STUDENT' | 'ADMIN' | 'CLUB_ADMIN' | 'CAREER_ADMIN' | 'SUPER_ADMIN';

export enum UserRoles {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  CLUB_ADMIN = 'CLUB_ADMIN',
  CAREER_ADMIN = 'CAREER_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface UserGameStats {
  totalPoints: number;
  gamesPlayed: number;
  levelsCleared: number;
  averageAccuracy: number;
  gameWiseHighScores: Record<string, number>;
  codingGauntletPoints?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubMembership?: string[];
  status: 'active' | 'inactive';
  pendingClubRequests?: string[];
  gameStats?: UserGameStats;
}

export interface Club {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bannerImage: string;
  logo: string;
  facultyName?: string;
  facultyPhoto?: string;
  facultyRole?: string;
  themeColor?: string;
}

export interface Activity {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  date: string;
  reportUrl: string;
  photos: string[];
  videoUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  clubId?: string;
}

export interface Achievement {
  id: string;
  participantName: string;
  activityId: string;
  activityName: string;
  achievement: string;
  certificateUrl: string;
  userId?: string;
}

export interface PostComment {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface AchievementPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  timestamp: string;
  topic: string;
  domain: string;
  rank: string;
  description: string;
  photos: string[];
  videoUrl?: string;
  likes: string[];
  comments: PostComment[];
}

export interface CareerItem {
  id: string;
  type: 'placement' | 'internship' | 'hackathon' | 'insight';
  title: string;
  company?: string;
  description: string;
  link?: string;
  date?: string;
  isRecord?: boolean;
  studentName?: string;
  package?: string;
  studentPhoto?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  batch?: string;
  quote?: string;
  requirements?: string;
  whoCanApply?: string;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  clubId?: string;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
  };
}

export interface Announcement {
  id: string;
  text: string;
  timestamp: string;
  senderName: string;
  isGlobal?: boolean;
  clubId?: string;
}

// --- Coding Gauntlet Interfaces ---

export interface CodingProblem {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  difficulty: number;
  points: number;
  time_limit_seconds: number;
  prompt: string;
  code_snippet?: string | null;
  buggy_code?: string;
  bug_type?: 'syntax' | 'logical' | 'runtime' | 'edge_case';
  fixed_code?: string;
  options: string[];
  correct_answer: string;
  hint: string;
  explanation: string;
}

export interface CodingModule {
  id: string;
  name: string;
  description: string;
  problems: CodingProblem[];
}

// --- Global Settings ---

export type PortalTheme = 'default' | 'diwali' | 'eid' | 'ganpati' | 'festive' | 'dark';
export type StorageMode = 'google_drive' | 'database';

export interface PortalSettings {
  id: string;
  theme: PortalTheme;
  storageMode: StorageMode;
}
