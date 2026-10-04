import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shuffle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TournamentFormat } from '@/types/tournament';
import { FORMAT_LABELS, FORMAT_TEAM_COUNT } from '@/lib/bracket';

interface KnockoutSetupProps {
  format: Exclude<TournamentFormat, 'groups'>;
  onStart: (teams: string[]) => Promise<void>;
}

/** Admin enters all teams for a direct-knockout tournament. Pairs are slot 1 vs 2, 3 vs 4, ... */
export const KnockoutSetup = ({ format, onStart }: KnockoutSetupProps) => {
  const count = FORMAT_TEAM_COUNT[format];
  const [teams, setTeams] = useState<string[]>(Array(count).fill(''));
  const [saving, setSaving] = useState(false);

  const shuffle = () => {
    const t = [...teams];
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    setTeams(t);
  };

  const start = async () => {
    const names = teams.map(t => t.trim());
    if (names.some(n => !n)) return toast.error(`Enter all ${count} team names`);
    const lower = names.map(n => n.toLowerCase());
    if (new Set(lower).size !== lower.length) return toast.error('Team names must be unique');
    setSaving(true);
    try {
      await onStart(names);
      toast.success('Bracket created!');
    } catch {
      toast.error('Failed to create bracket');
    } finally {
      setSaving(false);
    }
  };

  const half = count / 2;
  const renderSide = (from: number, label: string) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
      {Array.from({ length: half / 2 }).map((_, i) => {
        const a = from + i * 2;
        return (
          <div key={a} className="p-2 rounded-lg border border-border space-y-1">
            <p className="text-xs text-muted-foreground">Match {a / 2 + 1}</p>
            {[a, a + 1].map(idx => (
              <Input
                key={idx}
                placeholder={`Team ${idx + 1}`}
                value={teams[idx]}
                onChange={e => setTeams(prev => prev.map((t, k) => (k === idx ? e.target.value : t)))}
              />
            ))}
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Set up {FORMAT_LABELS[format]} ({count} teams)</CardTitle>
        <p className="text-sm text-muted-foreground">Enter the teams. Each pair plays each other. Left side and right side meet in the final.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {renderSide(0, 'Left side')}
          {renderSide(half, 'Right side')}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={shuffle} className="flex-1"><Shuffle className="w-4 h-4 mr-2" />Random draw</Button>
          <Button onClick={start} disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Start Bracket'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
