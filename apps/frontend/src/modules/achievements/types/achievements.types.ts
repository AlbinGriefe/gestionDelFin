export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  awardedAt: string | null;
  progress: { current: number; target: number };
}

export interface AchievementsSummary {
  unlockedCount: number;
  total: number;
  totalPoints: number;
  level: number;
  levelProgressPct: number;
  pointsToNextLevel: number;
}

export interface AchievementsResponse {
  items: Achievement[];
  justUnlocked: string[];
  summary: AchievementsSummary;
}
