import { COLLEGES, DEGREE_PROGRAMS } from './academics';

export interface StudentProfile {
  studentNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  emailUsername: string;
  phone: string;
  college: typeof COLLEGES[number];
  degreeProgram: string;
  isActive: boolean;
  isEnrolled: boolean;
}

const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Rosa', 'Carlos', 'Isabel', 'Miguel', 'Teresa', 'Andres', 'Patricia', 'Rafael', 'Monica', 'Fernando', 'Lucia', 'Diego', 'Sofia'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Gonzales', 'Flores', 'Rivera', 'Morales', 'Ortega', 'Ramos', 'Vargas', 'Castillo', 'Jimenez', 'Herrera', 'Medina', 'Aguilar', 'Vega'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStudentNumber(): string {
  const year = 2020 + Math.floor(Math.random() * 7);
  const num = 10000 + Math.floor(Math.random() * 90000);
  return `${year}-${num}`;
}

export const MOCK_STUDENTS: StudentProfile[] = Array.from({ length: 45 }, (_, i) => {
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const middleInitial = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';
  const college = randomItem([...COLLEGES] as string[]) as typeof COLLEGES[number];
  const degreeProgram = randomItem(DEGREE_PROGRAMS);
  const studentNumber = randomStudentNumber();
  const emailUsername = (firstName[0] + middleInitial[0] + lastName.toLowerCase().replace(/\s/g, '') + (i + 1)).toLowerCase();

  return {
    studentNumber,
    firstName,
    middleInitial,
    lastName,
    emailUsername,
    phone: `+63 9${Math.floor(100000000 + Math.random() * 900000000)}`,
    college: college,
    degreeProgram,
    isActive: Math.random() > 0.15,
    isEnrolled: Math.random() > 0.1,
  };
});

// Add a few specific test cases
MOCK_STUDENTS.unshift(
  {
    studentNumber: '2023-12345',
    firstName: 'Juan Carlos',
    middleInitial: 'M.',
    lastName: 'Santos',
    emailUsername: 'jmsantos2',
    phone: '+63 917 123 4567',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    isActive: true,
    isEnrolled: true,
  },
  {
    studentNumber: '2022-09876',
    firstName: 'Maria Elena',
    middleInitial: 'R.',
    lastName: 'Reyes',
    emailUsername: 'merreys3',
    phone: '+63 918 987 6543',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Electrical Engineering',
    isActive: true,
    isEnrolled: true,
  },
  {
    studentNumber: '2024-55555',
    firstName: 'Test',
    middleInitial: 'A.',
    lastName: 'Inactive',
    emailUsername: 'tainactive',
    phone: '+63 999 555 5555',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    isActive: false,
    isEnrolled: false,
  }
);