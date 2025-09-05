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
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface Fixture {
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