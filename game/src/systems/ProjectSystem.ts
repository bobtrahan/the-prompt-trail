import { PROJECTS } from '../data/projects';
import type { ProjectDef } from '../data/projects';

export class ProjectSystem {
  getProjectForDay(day: number): ProjectDef | undefined {
    return PROJECTS.find(p => p.day === day);
  }
}
