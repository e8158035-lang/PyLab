import { BEGINNER_LESSONS } from './lessonsBeginner';
import { INTERMEDIATE_LESSONS } from './lessonsIntermediate';
import { ADVANCED_LESSONS } from './lessonsAdvanced';
import { APPLIED_PROJECTS, LEARNING_BADGES } from './lessonsProjects';
import type { LearningLesson } from '../types/pylab';

export const ALL_LESSONS: LearningLesson[] = [
  ...BEGINNER_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
].sort((a, b) => a.order - b.order);

export { APPLIED_PROJECTS, LEARNING_BADGES };
