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

export const MOCK_USER: UserProfile = {
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
  rfidCardMasked: '•••• •••• A3F9',
  pushEnabled: false
};
