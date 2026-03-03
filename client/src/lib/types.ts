export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  credits: number;
  created_at: string;
}

export interface UserProfile extends User {
  has_password: boolean;
  has_google: boolean;
  daily_analysis_count: number;
  total_analyses: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AnalysisSummary {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ScoreBreakdown {
  skill_match: number;
  seniority_alignment: number;
  github_signal: number;
  bonus_factors: number;
  weights_used: Record<string, number>;
  weighted_total: number;
}

export interface SkillGaps {
  matchedSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
  partialMatches: {
    skill: string;
    candidateHas: string;
    matchStrength: string;
  }[];
  extraSkills: string[];
}

export interface AnalysisFull {
  id: string;
  user_id: string;
  resume_id: string;
  job_description_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: string | null;
  score_breakdown: ScoreBreakdown | null;
  skill_gaps: SkillGaps | null;
  github_signals: Record<string, unknown> | null;
  roadmap: string | null;
  resume_suggestions: string | null;
  token_usage: Record<string, unknown> | null;
  github_url: string | null;
  share_token: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PaginatedAnalyses {
  analyses: AnalysisSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalysisNote {
  id: string;
  analysis_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SavedResume {
  id: string;
  name: string;
  analysis_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  statusCode: number;
}
