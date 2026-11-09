export interface Reviewer {
  id: string;
  title: string;
  authors: string[];
  description: string;
  courseCode: string;
  tags: string[];
  fileSize: string;
  hasSelectableText: boolean;
  manualSummary?: string;
  bookmarked: boolean;
  publishedAt: string;
}

export const MOCK_REVIEWERS: Reviewer[] = [
  {
    id: 'rev1',
    title: 'ME 21 Engineering Mechanics - Midterm Reviewer',
    authors: ['Prof. Santos', 'DME Volcorps'],
    description: 'Comprehensive review guide covering statics, trusses, friction, and centroid formulas.',
    courseCode: 'ME 21',
    tags: ['Statics', 'Midterms', 'Mechanics'],
    fileSize: '4.2 MB',
    hasSelectableText: true,
    bookmarked: true,
    publishedAt: '2026-10-15'
  },
  {
    id: 'rev2',
    title: 'ME 31 Thermodynamics Formula Sheet & Solved Problems',
    authors: ['Engr. Reyes'],
    description: 'Scanned handwritten problem sets and property tables for ideal gas laws and cycles.',
    courseCode: 'ME 31',
    tags: ['Thermodynamics', 'Cycles', 'Formulas'],
    fileSize: '12.8 MB',
    hasSelectableText: false,
    manualSummary: 'Scanned handwritten notes on First and Second Law of Thermodynamics, Rankine cycle, and Carnot efficiency calculations.',
    bookmarked: false,
    publishedAt: '2026-09-20'
  },
  {
    id: 'rev3',
    title: 'ME 51 Fluid Mechanics Final Exam Archive (2023-2025)',
    authors: ['Mechanics Volcorps Academics'],
    description: 'Past final exams with answer keys for fluid statics, Bernoulli equation, and pipe flow.',
    courseCode: 'ME 51',
    tags: ['Fluids', 'Exams', 'Finals'],
    fileSize: '8.5 MB',
    hasSelectableText: true,
    bookmarked: true,
    publishedAt: '2026-10-28'
  },
  {
    id: 'rev4',
    title: 'ME 41 Machine Elements Design Summary',
    authors: ['DME Student Council'],
    description: 'Design equations for shafts, gears, bearings, and fasteners with failure criteria.',
    courseCode: 'ME 41',
    tags: ['Machine Design', 'Gears', 'Shafts'],
    fileSize: '6.1 MB',
    hasSelectableText: true,
    bookmarked: false,
    publishedAt: '2026-10-02'
  }
];
