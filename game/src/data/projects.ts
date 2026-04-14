export interface ProjectDef {
  id: string;
  name: string;
  description: string;
  maxReputation: number;
}

export const PROJECTS: ProjectDef[] = [
  { id: 'p1', name: 'Static Landing Page', description: 'Just HTML and a bit of CSS.', maxReputation: 100 },
  { id: 'p2', name: 'Contact Form', description: 'Serverless function handling.', maxReputation: 150 },
  { id: 'p3', name: 'JS Calculator', description: 'Basic logic and UI.', maxReputation: 200 },
  { id: 'p4', name: 'Weather App', description: 'API integration practice.', maxReputation: 300 },
  { id: 'p5', name: 'Auth System', description: 'JWTs and local storage.', maxReputation: 450 },
  { id: 'p6', name: 'Real-time Chat', description: 'WebSockets are tricky.', maxReputation: 600 },
  { id: 'p7', name: 'Inventory Dashboard', description: 'Data viz and tables.', maxReputation: 800 },
  { id: 'p8', name: 'Mobile App Port', description: 'React Native struggle.', maxReputation: 1100 },
  { id: 'p9', name: 'Blockchain Wallet', description: 'Web3 hype cycle.', maxReputation: 1500 },
  { id: 'p10', name: 'AI Image Gen', description: 'Stable Diffusion API.', maxReputation: 2000 },
  { id: 'p11', name: 'Video Editor', description: 'FFmpeg WASM hell.', maxReputation: 3000 },
  { id: 'p12', name: 'OS Emulator', description: 'Recursion starts now.', maxReputation: 4500 },
  { id: 'p13', name: 'The Singularity', description: 'Final project.', maxReputation: 7500 },
];
