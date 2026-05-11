export interface KPIs {
  classMastery: number;
  classMasteryDelta: number;
  atRiskCount: number;
  excellingCount: number;
  masteredSkillsCount: number;
  totalSkills: number;
}

export interface WeeklyPoint {
  week: string;
  classMastery: number;
  schoolMastery: number;
}

export interface TopicDifficulty {
  topic: string;
  avgMastery: number;
  skillCount: number;
}

export interface ScoreBucket { range: string; count: number }

export interface ScoreDist {
  buckets: ScoreBucket[];
  passRate: number;
  median: number;
  stdDev: number;
}

export interface Benchmarks { classAvg: number; schoolAvg: number }

export interface SiblingClass {
  id: string;
  name: string;
  avgMastery: number;
  size: number;
}

export interface TermTrendPoint {
  termId: string;
  label: string;
  avgMastery: number;
  studentCount: number;
}

export interface ClassOverview {
  kpis: KPIs;
  weeklyProgress: WeeklyPoint[];
  topicDifficulty: TopicDifficulty[];
  scoreDistribution: ScoreDist;
  benchmarks: Benchmarks;
  siblingClasses: SiblingClass[];
  termTrend: TermTrendPoint[];
}

export interface StudentRosterItem {
  studentId: string;
  name: string;
  avgMastery: number;
  velocity: number;
  avgScore: number;
  submissions: number;
  onTime: number;
  lastActiveDays: number;
  atRisk: boolean;
  excelling: boolean;
  planActive: boolean;
  lastActiveAt: string | null;
}

export interface SkillMastery {
  skillId: string;
  skillName: string;
  topic: string;
  masteryProb: number;
  classAvg: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StudentWeeklyPoint {
  week: string;
  student: number | null;
  classMastery: number | null;
  schoolMastery: number;
}

export interface StudentMasteryDetail {
  skills: SkillMastery[];
  weeklyProgress: StudentWeeklyPoint[];
}

export interface HeatmapStudent { id: string; name: string; avatar: string; atRisk: boolean }
export interface HeatmapSkill   { id: string; name: string; topic: string }

export interface HeatmapData {
  students: HeatmapStudent[];
  skills: HeatmapSkill[];
  matrix: Record<string, Record<string, number>>;
}

export interface Misconception {
  skillId: string;
  skillName: string;
  topic: string;
  label: string;
  frequency: number;
  severity: 'high' | 'med' | 'low';
}

export interface StudentSubmission {
  id: string;
  assessmentName: string;
  topics: string[];
  submittedAt: string;
  score: number;
  gradedBy: string;
  status: string;
}
