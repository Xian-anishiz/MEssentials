/**
 * Mock user accounts for frontend V1.0 authentication.
 * 
 * Provides static student, volunteer, and admin account profiles for
 * the three separate login flows. Used by authState store for mock login.
 * Will be replaced with real database authentication in Database V2.x.
 */

export interface UserProfile {
  firstName: string;
  middleInitial: string;
  lastName: string;
  studentNumber: string;
  emailUsername: string;
  phone: string;
  college: string;
  degreeProgram: string;
  role: 'student' | 'volunteer' | 'admin';
  volunteerRoles: string[];
  rfidCardLinked: boolean;
  rfidCardMasked: string;
  pushEnabled: boolean;
}

export type AccountType = 'student' | 'volunteer' | 'admin';

export const MOCK_ACCOUNTS: Record<AccountType, UserProfile> = {
  student: {
    firstName: 'Juan Carlos',
    middleInitial: 'M.',
    lastName: 'Santos',
    studentNumber: '2023-12345',
    emailUsername: 'jmsantos2',
    phone: '+63 917 123 4567',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    role: 'student',
    volunteerRoles: [],
    rfidCardLinked: true,
    rfidCardMasked: '\u2549\u2576\u2549\u2576 \u2549\u2576\u2549\u2576 A3F9',
    pushEnabled: false
  },
  volunteer: {
    firstName: 'Juan Carlos',
    middleInitial: 'M.',
    lastName: 'Santos',
    studentNumber: '2023-12345',
    emailUsername: 'jmsantos2',
    phone: '+63 917 123 4567',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    role: 'volunteer',
    volunteerRoles: ['store_manager', 'kailangan_manager', 'megaral_manager', 'medays_manager', 'registration_manager'],
    rfidCardLinked: true,
    rfidCardMasked: '\u2549\u2576\u2549\u2576 \u2549\u2576\u2549\u2576 A3F9',
    pushEnabled: false
  },
  admin: {
    firstName: 'Engr. Ana',
    middleInitial: 'B.',
    lastName: 'Panganiban',
    studentNumber: '2019-00001',
    emailUsername: 'abpanganiban',
    phone: '+63 917 999 0001',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    role: 'admin',
    volunteerRoles: ['store_manager', 'kailangan_manager', 'megaral_manager', 'medays_manager', 'registration_manager'],
    rfidCardLinked: false,
    rfidCardMasked: '',
    pushEnabled: true
  }
};

// Kept for backwards compatibility with existing imports
export const MOCK_USER = MOCK_ACCOUNTS.volunteer;
