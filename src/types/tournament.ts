export interface Team {
  id: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalDifference: number;
  // ✅ FIX: ADD THE MISSING 'played' PROPERTY
  played: number; 
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchday: number;
  round: number;
  groupId: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  groupId: string;
  date: string;
}

export type KnockoutRound = 'r16' | 'quarter' | 'semi' | 'final';

/** How a tournament starts: with group stages, or directly at a knockout round. */
export type TournamentFormat = 'groups' | 'r16' | 'quarter' | 'semi';

export interface KnockoutMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  round: KnockoutRound;
  matchNumber: number;
}