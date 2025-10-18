import { Match, Group } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History } from 'lucide-react';

interface PublicMatchHistoryProps {
  groups: Group[];
  matches: Match[];
}

export const PublicMatchHistory = ({ groups, matches }: PublicMatchHistoryProps) => {
  const getTeamName = (teamId: string) => {
    for (const group of groups) {
      const team = group.teams.find(t => t.id === teamId);
      if (team) return team.name;
    }
    return 'Unknown Team';
  };

  const getMatchesForGroup = (groupId: string) => {
    return matches.filter(match => match.groupId === groupId);
  };

  const getResultBadge = (homeScore: number, awayScore: number, isHome: boolean) => {
    if (homeScore === awayScore) return <Badge variant="secondary">D</Badge>;
    if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
      return <Badge className="bg-qualified-first text-white">W</Badge>;
    }
    return <Badge variant="destructive">L</Badge>;
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No matches played yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Match History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={groups[0]?.id} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${groups.length}, 1fr)` }}>
            {groups.map((group) => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {groups.map((group) => (
            <TabsContent key={group.id} value={group.id} className="space-y-3 mt-4">
              {getMatchesForGroup(group.id).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No matches played yet in {group.name}
                </p>
              ) : (
                <div className="space-y-2">
                  {getMatchesForGroup(group.id)
                    .slice()
                    .reverse()
                    .map((match) => (
                      <div 
                        key={match.id} 
                        className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow animate-fade-in"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-semibold text-sm">{getTeamName(match.homeTeam)}</span>
                            {getResultBadge(match.homeScore, match.awayScore, true)}
                          </div>
                          
                          <div className="flex items-center gap-2 px-4 py-1 bg-primary/10 rounded-lg">
                            <span className="text-xl font-bold text-primary">{match.homeScore}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-xl font-bold text-primary">{match.awayScore}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {getResultBadge(match.homeScore, match.awayScore, false)}
                            <span className="font-semibold text-sm">{getTeamName(match.awayTeam)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          {new Date(match.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
