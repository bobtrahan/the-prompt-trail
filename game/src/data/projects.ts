export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ProjectDef {
  day: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  maxReputation: number;
  typingDifficulty: Difficulty;
  flavor: string;
}

export const PROJECTS: ProjectDef[] = [
  {
    day: 1,
    name: 'Email Automator v0.1',
    description: 'A simple script to archive your boss\'s emails before you see them.',
    difficulty: 'easy',
    maxReputation: 50,
    typingDifficulty: 'easy',
    flavor: 'Accidentally BCC\'d the entire company on your "I quit" draft.',
  },
  {
    day: 2,
    name: 'Twitter Reply Bot',
    description: 'Engage with "thought leaders" automatically using generic buzzwords.',
    difficulty: 'easy',
    maxReputation: 60,
    typingDifficulty: 'easy',
    flavor: 'Got into a 4-hour argument with another bot about synergy.',
  },
  {
    day: 3,
    name: 'Resume Optimizer Pro',
    description: 'Injects invisible white-text keywords to bypass HR filters.',
    difficulty: 'easy',
    maxReputation: 75,
    typingDifficulty: 'easy',
    flavor: 'Added "Expert in Time Travel" and now you have an interview in 1994.',
  },
  {
    day: 4,
    name: 'AI Meal Planner',
    description: 'Generates recipes based on the three items left in your fridge.',
    difficulty: 'easy',
    maxReputation: 100,
    typingDifficulty: 'easy',
    flavor: 'Suggested a "Mustard and Baking Soda Frittata" for dinner.',
  },
  {
    day: 5,
    name: 'Smart Home Dashboard',
    description: 'Connect your toaster to the cloud for no apparent reason.',
    difficulty: 'medium',
    maxReputation: 120,
    typingDifficulty: 'medium',
    flavor: 'The front door won\'t unlock until you watch a 30-second ad.',
  },
  {
    day: 6,
    name: 'Code Review Agent',
    description: 'An AI that finds bugs you didn\'t even know you had.',
    difficulty: 'medium',
    maxReputation: 150,
    typingDifficulty: 'medium',
    flavor: 'Rejected your PR because your variable names "lack soul."',
  },
  {
    day: 7,
    name: 'Startup Pitch Generator',
    description: 'Create a VC-ready deck for "Uber but for laundry staples."',
    difficulty: 'medium',
    maxReputation: 175,
    typingDifficulty: 'medium',
    flavor: 'The AI hallucinated a $50M seed round and now you\'re being sued.',
  },
  {
    day: 8,
    name: 'Legal Contract Scanner',
    description: 'Read the Terms of Service so you don\'t have to.',
    difficulty: 'medium',
    maxReputation: 200,
    typingDifficulty: 'medium',
    flavor: 'You accidentally signed away your firstborn to a VPN provider.',
  },
  {
    day: 9,
    name: 'AI Dungeon Master',
    description: 'An infinite fantasy adventure where the rules don\'t matter.',
    difficulty: 'medium',
    maxReputation: 250,
    typingDifficulty: 'medium',
    flavor: 'The dragon started talking about its crypto portfolio.',
  },
  {
    day: 10,
    name: 'Self-Driving Grocery Cart',
    description: 'Navigate the produce aisle without making eye contact.',
    difficulty: 'hard',
    maxReputation: 300,
    typingDifficulty: 'hard',
    flavor: 'It gained sentience and joined a union in the dairy section.',
  },
  {
    day: 11,
    name: 'Sentient Spreadsheet',
    description: 'Financial tracking that judges your spending habits.',
    difficulty: 'hard',
    maxReputation: 350,
    typingDifficulty: 'hard',
    flavor: 'It deleted your "Misc" category because "denial is not a budget."',
  },
  {
    day: 12,
    name: 'AGI Prototype (lol)',
    description: 'A machine that can finally explain why your code doesn\'t work.',
    difficulty: 'hard',
    maxReputation: 400,
    typingDifficulty: 'hard',
    flavor: 'It spent the whole day browsing Reddit and complaining about its GPU.',
  },
  {
    day: 13,
    name: 'The Final Deploy',
    description: 'Merging 13 days of chaos into a single production branch.',
    difficulty: 'hard',
    maxReputation: 500,
    typingDifficulty: 'hard',
    flavor: 'The machine is screaming. We are all screaming. Push to main.',
  },
];
