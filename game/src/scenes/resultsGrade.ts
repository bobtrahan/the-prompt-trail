import { PROJECTS } from '../data/projects';

export const RANK_COLORS: Record<string, string> = {
  S: '#f2cc60',
  A: '#3fb950',
  B: '#58a6ff',
  C: '#e6edf3',
  D: '#d68a00',
  F: '#f85149',
};

export const GRADE_FLAVOR: Record<string, string> = {
  S: 'On track for legend status.',
  A: 'Solid. Your agents are pulling their weight.',
  B: 'Decent. A few more incidents and this gets dicey.',
  C: 'Marginal. Start grinding or start panicking.',
  D: 'This is a recovery situation.',
  F: 'The investors have left the building.',
};

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface RunningGrade {
  cumulativeEarned: number;
  cumulativePossible: number;
  percentage: number;
  rank: Rank;
}

export function calcRunningGrade(dayScores: number[], day: number): RunningGrade {
  const completedDays = Math.max(0, Math.min(day, PROJECTS.length));
  const cumulativeEarned = dayScores.slice(0, completedDays).reduce((sum, score) => sum + score, 0);
  const cumulativePossible = PROJECTS
    .slice(0, completedDays)
    .reduce((sum, project) => sum + project.maxReputation, 0);
  const percentage = cumulativePossible > 0 ? cumulativeEarned / cumulativePossible : 0;

  let rank: Rank = 'F';
  if (percentage >= 1.15) rank = 'S';
  else if (percentage >= 0.90) rank = 'A';
  else if (percentage >= 0.70) rank = 'B';
  else if (percentage >= 0.50) rank = 'C';
  else if (percentage >= 0.30) rank = 'D';

  return {
    cumulativeEarned,
    cumulativePossible,
    percentage,
    rank,
  };
}
