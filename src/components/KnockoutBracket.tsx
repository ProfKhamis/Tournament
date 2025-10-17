import { KnockoutMatch } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface KnockoutBracketProps {
  matches: KnockoutMatch[];
  onUpdateScore: (matchId: string, homeScore: number, awayScore: number) => void;
}

export const KnockoutBracket = ({ matches, onUpdateScore }: KnockoutBracketProps) => {
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  const quarters = matches.filter(m => m.round === 'quarter');
  const semis = matches.filter(m => m.round === 'semi');
  const final = matches.find(m => m.round === 'final');

  const handleSubmitScore = (matchId: string) => {
    const score = scores[matchId];
    if (!score) return;
    
    const homeScore = parseInt(score.home);
    const awayScore = parseInt(score.away);
    
    if (isNaN(homeScore) || isNaN(awayScore)) return;
    
    onUpdateScore(matchId, homeScore, awayScore);
    setScores(prev => ({ ...prev, [matchId]: { home: '', away: '' } }));
  };

  const MatchCard = ({ match }: { match: KnockoutMatch }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">{match.homeTeam}</span>
            {match.homeScore !== null && (
              <span className="font-bold text-lg">{match.homeScore}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">{match.awayTeam}</span>
            {match.awayScore !== null && (
              <span className="font-bold text-lg">{match.awayScore}</span>
            )}
          </div>
          {match.homeScore === null && match.homeTeam && match.awayTeam && (
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                placeholder="Home"
                value={scores[match.id]?.home || ''}
                onChange={(e) => setScores(prev => ({
                  ...prev,
                  [match.id]: { ...prev[match.id], home: e.target.value }
                }))}
              />
              <Input
                type="number"
                placeholder="Away"
                value={scores[match.id]?.away || ''}
                onChange={(e) => setScores(prev => ({
                  ...prev,
                  [match.id]: { ...prev[match.id], away: e.target.value }
                }))}
              />
              <Button onClick={() => handleSubmitScore(match.id)}>Submit</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Quarter Finals</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quarters.map(match => <MatchCard key={match.id} match={match} />)}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Semi Finals</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {semis.map(match => <MatchCard key={match.id} match={match} />)}
        </div>
      </div>

      {final && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Final</h2>
          <div className="max-w-md mx-auto">
            <MatchCard match={final} />
          </div>
        </div>
      )}
    </div>
  );
};
