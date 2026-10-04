import { KnockoutMatch, KnockoutRound } from '@/types/tournament';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { ROUND_LABELS, ROUND_ORDER } from '@/lib/bracket';
import { toast } from 'sonner';

interface KnockoutBracketProps {
  matches: KnockoutMatch[];
  onUpdateScore: (matchId: string, homeScore: number, awayScore: number) => void;
  readOnly?: boolean;
}

const TeamRow = ({ name, score, winner }: { name: string; score: number | null; winner: boolean }) => (
  <div className={`flex justify-between items-center gap-2 px-2 py-1.5 rounded ${winner ? 'bg-primary/15 font-bold' : ''}`}>
    <span className={`truncate text-sm ${name ? '' : 'text-muted-foreground italic'}`}>{name || 'TBD'}</span>
    <span className="text-sm font-bold tabular-nums">{score ?? '-'}</span>
  </div>
);

const MatchCard = ({ match, readOnly, onUpdateScore }: { match: KnockoutMatch; readOnly: boolean; onUpdateScore: KnockoutBracketProps['onUpdateScore'] }) => {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const played = match.homeScore !== null && match.awayScore !== null;
  const homeWin = played && match.homeScore! > match.awayScore!;
  const awayWin = played && match.awayScore! > match.homeScore!;
  const canScore = !readOnly && !played && !!match.homeTeam && !!match.awayTeam;

  const submit = () => {
    const h = parseInt(home), a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return toast.error('Enter valid scores for both teams');
    if (h === a) return toast.error('Knockout matches need a winner. Include the penalty result.');
    onUpdateScore(match.id, h, a);
  };

  return (
    <div className="w-48 sm:w-52 bg-card border border-border rounded-lg shadow-sm p-1.5 space-y-0.5">
      <TeamRow name={match.homeTeam} score={match.homeScore} winner={homeWin} />
      <div className="h-px bg-border" />
      <TeamRow name={match.awayTeam} score={match.awayScore} winner={awayWin} />
      {canScore && (
        <div className="flex gap-1 pt-1">
          <Input type="number" min={0} className="h-7 px-1 text-center" value={home} onChange={e => setHome(e.target.value)} />
          <Input type="number" min={0} className="h-7 px-1 text-center" value={away} onChange={e => setAway(e.target.value)} />
          <Button size="sm" className="h-7 px-2" onClick={submit}>OK</Button>
        </div>
      )}
    </div>
  );
};

const RoundColumn = ({ title, matches, readOnly, onUpdateScore }: { title: string; matches: KnockoutMatch[]; readOnly: boolean; onUpdateScore: KnockoutBracketProps['onUpdateScore'] }) => (
  <div className="flex flex-col shrink-0">
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-3">{title}</h3>
    <div className="flex flex-col justify-around flex-1 gap-4">
      {matches.map(m => <MatchCard key={m.id} match={m} readOnly={readOnly} onUpdateScore={onUpdateScore} />)}
    </div>
  </div>
);

export const KnockoutBracket = ({ matches, onUpdateScore, readOnly = false }: KnockoutBracketProps) => {
  const rounds = ROUND_ORDER.filter(r => matches.some(m => m.round === r && r !== 'final'));
  const byRound = (r: KnockoutRound) => matches.filter(m => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber);
  const final = matches.find(m => m.round === 'final');
  const champion = final && final.homeScore !== null && final.awayScore !== null
    ? (final.homeScore > final.awayScore ? final.homeTeam : final.awayTeam)
    : null;

  const left = rounds.map(r => { const ms = byRound(r); return { r, ms: ms.slice(0, ms.length / 2) }; });
  const right = rounds.map(r => { const ms = byRound(r); return { r, ms: ms.slice(ms.length / 2) }; }).reverse();

  return (
    <div className="space-y-4">
      {champion && (
        <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/30">
          <Trophy className="w-8 h-8 mx-auto text-primary mb-1" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Champion</p>
          <p className="text-2xl font-extrabold text-primary">{champion}</p>
        </div>
      )}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 sm:gap-6 min-w-max mx-auto w-max items-stretch">
          {left.map(({ r, ms }) => (
            <RoundColumn key={`l-${r}`} title={ROUND_LABELS[r]} matches={ms} readOnly={readOnly} onUpdateScore={onUpdateScore} />
          ))}
          {final && (
            <div className="flex flex-col shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary text-center mb-3">Final</h3>
              <div className="flex flex-col justify-center flex-1 items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                <MatchCard match={final} readOnly={readOnly} onUpdateScore={onUpdateScore} />
              </div>
            </div>
          )}
          {right.map(({ r, ms }) => (
            <RoundColumn key={`r-${r}`} title={ROUND_LABELS[r]} matches={ms} readOnly={readOnly} onUpdateScore={onUpdateScore} />
          ))}
        </div>
      </div>
    </div>
  );
};
