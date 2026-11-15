export interface EventItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number | null;
  registered: boolean;
  prompts: { id: string; prompt: string; required: boolean }[];
}

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'ev1',
    name: 'ME Days 2026 Opening Ceremony & Exhibit',
    category: 'recreational',
    description: 'Official kick-off for ME Days 2026 featuring department booths, robotics showcase, and alumni talks.',
    location: 'UP Velasquez Auditorium',
    startsAt: '2026-11-15 09:00 AM',
    capacity: 250,
    registered: true,
    prompts: [
      { id: 'pr1', prompt: 'Dietary restriction / Food allergy (if attending banquet)', required: false },
      { id: 'pr2', prompt: 'Will you volunteer for booth setup?', required: true }
    ]
  },
  {
    id: 'ev2',
    name: 'CAD Speed Modeling & FEA Workshop',
    category: 'academic',
    description: 'Hands-on advanced SolidWorks and ANSYS simulation workshop hosted by industry partners.',
    location: 'CAD Laboratory, Melchor Hall',
    startsAt: '2026-11-18 01:00 PM',
    capacity: 40,
    registered: true,
    prompts: [
      { id: 'pr3', prompt: 'Your current proficiency level in CAD (Beginner/Intermediate/Advanced)', required: true }
    ]
  },
  {
    id: 'ev3',
    name: 'Mechanical Engineering Alumni Career Fair',
    category: 'career',
    description: 'Connect with top engineering firms, energy companies, and manufacturing enterprises.',
    location: 'NCPAG Assembly Hall',
    startsAt: '2026-11-22 10:00 AM',
    capacity: 300,
    registered: false,
    prompts: [
      { id: 'pr4', prompt: 'Expected graduation semester / Year standing', required: true }
    ]
  },
  {
    id: 'ev4',
    name: 'ME Night & Recognition Banquet',
    category: 'recreational',
    description: 'An evening of celebration, awards, performances, and socials for DME students and faculty.',
    location: 'UP Alumni Center',
    startsAt: '2026-11-25 06:00 PM',
    capacity: 180,
    registered: false,
    prompts: [
      { id: 'pr5', prompt: 'Plus one guest full name (optional)', required: false }
    ]
  }
];
