export const COLLEGES = [
  'College of Engineering',
] as const;

export const DEGREE_PROGRAMS = [
    'B.S. Mechanical Engineering',
    'B.S. Electrical Engineering',
    'B.S. Electronics Engineering',
    'B.S. Computer Engineering',
    'B.S. Chemical Engineering',
    'B.S. Civil Engineering',
    'B.S. Industrial Engineering',
    'B.S. Materials Engineering',
    'B.S. Metallurgical Engineering',
    'B.S. Computer Science'
]

export function getDegreeProgramOptions(_college: string): string[] {
  return DEGREE_PROGRAMS;
}