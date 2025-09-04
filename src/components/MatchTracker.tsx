import { Match, Group } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MatchTrackerProps {
  groups: Group[];
  matches: Match[];
}

const MatchTracker = ({ groups, matches }: MatchTrackerProps) => {
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

  const getTeamMatchCount = (teamId: string, groupId: string) => {
    return matches.filter(match => 
      match.groupId === groupId && 
      (match.homeTeam === teamId || match.awayTeam === teamId)
    ).length;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Match Tracker</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Track played matches and ensure fairness across all teams
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={groups[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {groups.map((group) => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {groups.map((group) => (
            <TabsContent key={group.id} value={group.id} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Match Counts */}
                <div>
                  <h4 className="font-semibold mb-3">Matches Played</h4>
                  <div className="space-y-2">
                    {group.teams.map((team) => {
                      const matchCount = getTeamMatchCount(team.id, group.id);
                      return (
                        <div key={team.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">{team.name}</span>
                          <Badge variant={matchCount === 0 ? "destructive" : matchCount < 3 ? "secondary" : "default"}>
                            {matchCount} matches
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Matches */}
                <div>
                  <h4 className="font-semibold mb-3">Recent Matches</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getMatchesForGroup(group.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No matches played yet
                      </p>
                    ) : (
                      getMatchesForGroup(group.id)
                        .slice()
                        .reverse()
                        .map((match) => (
                          <div key={match.id} className="p-3 bg-card border rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">{getTeamName(match.homeTeam)}</span>
                                <span className="mx-2 text-primary font-bold">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                                <span className="font-medium">{getTeamName(match.awayTeam)}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(match.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchTracker;