import { COLLEGES, DEGREE_PROGRAMS } from './academics';

export type VolunteerRole =
  | 'store_manager'
  | 'kailangan_manager'
  | 'megaral_manager'
  | 'medays_manager'
  | 'registration_manager';

export interface VolunteerProfile {
  studentNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  emailUsername: string;
  phone: string;
  college: string;
  degreeProgram: string;
  volunteerRoles: VolunteerRole[];
  isActive: boolean;
}

const firstNames = ['Alexander', 'Beatriz', 'Christian', 'Diana', 'Eduardo', 'Fatima', 'Gabriel', 'Helena', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Manuel', 'Natalia', 'Oscar', 'Paula', 'Roberto', 'Sandra', 'Tomas', 'Valeria'];
const lastNames = ['Dominguez', 'Velasquez', 'Herrera', 'Molina', 'Silva', 'Paredes', 'Cabrera', 'Navarro', 'Iglesias', 'Castro', 'Soto', 'Delgado', 'Ramirez', 'Gutierrez', 'Romero', 'Ruiz', 'Moreno', 'Alvarez', 'Torres', 'Vargas'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomStudentNumber(): string {
  const year = 2020 + Math.floor(Math.random() * 7);
  const num = 10000 + Math.floor(Math.random() * 90000);
  return `${year}-${num}`;
}

const ALL_ROLES: VolunteerRole[] = [
  'store_manager',
  'kailangan_manager',
  'megaral_manager',
  'medays_manager',
  'registration_manager',
];

export const MOCK_VOLUNTEERS: VolunteerProfile[] = [
  // Store Managers (3)
  {
    studentNumber: '2022-11111',
    firstName: 'Alexander',
    middleInitial: 'J.',
    lastName: 'Dominguez',
    emailUsername: 'ajdominguez',
    phone: '+63 917 111 1111',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['store_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-22222',
    firstName: 'Beatriz',
    middleInitial: 'M.',
    lastName: 'Velasquez',
    emailUsername: 'bmvelasquez',
    phone: '+63 917 222 2222',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Industrial Engineering',
    volunteerRoles: ['store_manager'],
    isActive: true,
  },
  {
    studentNumber: '2021-33333',
    firstName: 'Christian',
    middleInitial: 'R.',
    lastName: 'Herrera',
    emailUsername: 'crherrera',
    phone: '+63 917 333 3333',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Computer Engineering',
    volunteerRoles: ['store_manager', 'medays_manager'],
    isActive: true,
  },

  // Borrow Managers (3)
  {
    studentNumber: '2022-44444',
    firstName: 'Diana',
    middleInitial: 'L.',
    lastName: 'Molina',
    emailUsername: 'dlmolina',
    phone: '+63 917 444 4444',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['kailangan_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-55555',
    firstName: 'Eduardo',
    middleInitial: 'P.',
    lastName: 'Silva',
    emailUsername: 'epsilva',
    phone: '+63 917 555 5555',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Materials Engineering',
    volunteerRoles: ['kailangan_manager'],
    isActive: false,
  },
  {
    studentNumber: '2021-66666',
    firstName: 'Fatima',
    middleInitial: 'S.',
    lastName: 'Paredes',
    emailUsername: 'fsparedes',
    phone: '+63 917 666 6666',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Civil Engineering',
    volunteerRoles: ['kailangan_manager', 'registration_manager'],
    isActive: true,
  },
// Reviewer Managers (3)
  {
    studentNumber: '2022-77777',
    firstName: 'Gabriel',
    middleInitial: 'T.',
    lastName: 'Cabrera',
    emailUsername: 'gtcabrera',
    phone: '+63 917 777 7777',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['megaral_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-88888',
    firstName: 'Helena',
    middleInitial: 'V.',
    lastName: 'Navarro',
    emailUsername: 'hvnavarro',
    phone: '+63 917 888 8888',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Electrical Engineering',
    volunteerRoles: ['megaral_manager'],
    isActive: true,
  },
  {
    studentNumber: '2021-99999',
    firstName: 'Ivan',
    middleInitial: 'C.',
    lastName: 'Iglesias',
    emailUsername: 'iciglesias',
    phone: '+63 917 999 9999',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Electronics Engineering',
    volunteerRoles: ['megaral_manager', 'store_manager'],
    isActive: false,
  },

  // Events Managers (3)
  {
    studentNumber: '2022-10101',
    firstName: 'Julia',
    middleInitial: 'A.',
    lastName: 'Castro',
    emailUsername: 'jacastro',
    phone: '+63 917 101 0101',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['medays_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-11112',
    firstName: 'Kevin',
    middleInitial: 'B.',
    lastName: 'Soto',
    emailUsername: 'kbsoto',
    phone: '+63 917 111 1112',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Computer Science',
    volunteerRoles: ['medays_manager'],
    isActive: true,
  },
  {
    studentNumber: '2021-12121',
    firstName: 'Laura',
    middleInitial: 'D.',
    lastName: 'Delgado',
    emailUsername: 'lddelgado',
    phone: '+63 917 121 2121',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Industrial Engineering',
    volunteerRoles: ['medays_manager', 'kailangan_manager'],
    isActive: true,
  },

  // Queue Managers (3)
  {
    studentNumber: '2022-13131',
    firstName: 'Manuel',
    middleInitial: 'E.',
    lastName: 'Ramirez',
    emailUsername: 'meramirez',
    phone: '+63 917 131 3131',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['registration_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-14141',
    firstName: 'Natalia',
    middleInitial: 'F.',
    lastName: 'Gutierrez',
    emailUsername: 'nfgutierrez',
    phone: '+63 917 141 4141',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Chemical Engineering',
    volunteerRoles: ['registration_manager'],
    isActive: true,
  },
  {
    studentNumber: '2021-15151',
    firstName: 'Oscar',
    middleInitial: 'G.',
    lastName: 'Romero',
    emailUsername: 'ogromero',
    phone: '+63 917 151 5151',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Metallurgical Engineering',
    volunteerRoles: ['registration_manager', 'megaral_manager'],
    isActive: false,
  },

  // Additional mixed-role volunteers
  {
    studentNumber: '2022-16161',
    firstName: 'Paula',
    middleInitial: 'H.',
    lastName: 'Ruiz',
    emailUsername: 'phruiz',
    phone: '+63 917 161 6161',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Mechanical Engineering',
    volunteerRoles: ['store_manager', 'kailangan_manager', 'medays_manager'],
    isActive: true,
  },
  {
    studentNumber: '2023-17171',
    firstName: 'Roberto',
    middleInitial: 'I.',
    lastName: 'Moreno',
    emailUsername: 'rimmoreno',
    phone: '+63 917 171 7171',
    college: 'College of Engineering',
    degreeProgram: 'B.S. Civil Engineering',
    volunteerRoles: ['megaral_manager', 'registration_manager'],
    isActive: true,
  },
]