import { KnockoutMatch, KnockoutRound, TournamentFormat } from '@/types/tournament';

export const ROUND_ORDER: KnockoutRound[] = ['r16', 'quarter', 'semi', 'final'];

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  r16: 'Round of 16',
  quarter: 'Quarter Finals',
  semi: 'Semi Finals',
  final: 'Final',
};

export const FORMAT_TEAM_COUNT: Record<Exclude<TournamentFormat, 'groups'>, number> = {
  r16: 16,
  quarter: 8,
  semi: 4,
};

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  groups: 'Group Stage',
  r16: 'Round of 16',
  quarter: 'Quarter Finals',
  semi: 'Semi Finals',
};

const roundForTeamCount = (count: number): KnockoutRound => {
  if (count === 16) return 'r16';
  if (count === 8) return 'quarter';
  if (count === 4) return 'semi';
  return 'final';
};

const emptyMatch = (round: KnockoutRound, matchNumber: number): KnockoutMatch => ({
  id: `${round}-${matchNumber}`,
  homeTeam: '',
  awayTeam: '',
  homeScore: null,
  awayScore: null,
  round,
  matchNumber,
});

/** Builds a full bracket. `teams` must be in pairing order: [m1 home, m1 away, m2 home, ...]. */
export const buildBracket = (teams: string[]): KnockoutMatch[] => {
  const startRound = roundForTeamCount(teams.length);
  const startIdx = ROUND_ORDER.indexOf(startRound);
  const all: KnockoutMatch[] = [];
  let count = teams.length / 2;
  for (let r = startIdx; r < ROUND_ORDER.length; r++) {
    const round = ROUND_ORDER[r];
    for (let n = 1; n <= count; n++) {
      const m = emptyMatch(round, n);
      if (r === startIdx) {
        m.homeTeam = teams[(n - 1) * 2];
        m.awayTeam = teams[(n - 1) * 2 + 1];
      }
      all.push(m);
    }
    count = Math.max(1, count / 2);
  }
  return all;
};

/** Applies a score and pushes the winner into the next round slot. Works for legacy ids too. */
export const applyKnockoutScore = (
  matches: KnockoutMatch[],
  matchId: string,
  homeScore: number,
  awayScore: number,
): KnockoutMatch[] => {
  const updated = matches.map(m => (m.id === matchId ? { ...m, homeScore, awayScore } : { ...m }));
  const played = updated.find(m => m.id === matchId);
  if (!played || played.round === 'final') return updated;
  const winner = homeScore > awayScore ? played.homeTeam : played.awayTeam;
  const nextRound = ROUND_ORDER[ROUND_ORDER.indexOf(played.round) + 1];
  const nextNumber = Math.ceil(played.matchNumber / 2);
  const next = updated.find(m => m.round === nextRound && m.matchNumber === nextNumber);
  if (next) {
    if (played.matchNumber % 2 === 1) next.homeTeam = winner;
    else next.awayTeam = winner;
  }
  return updated;
};
