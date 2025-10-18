import { useMemo } from 'react';
import { Fixture, Group } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';

interface PublicFixturesViewProps {
  groups: Group[];
  fixtures: Fixture[];
}

export const PublicFixturesView = ({ groups, fixtures }: PublicFixturesViewProps) => {
  const allFixtures = useMemo(() => {
    const fixturesByGroup: Record<string, Fixture[]> = {};
    
    fixtures.forEach(fixture => {
      if (!fixturesByGroup[fixture.groupId]) {
        fixturesByGroup[fixture.groupId] = [];
      }
      fixturesByGroup[fixture.groupId].push(fixture);
    });
    
    return fixturesByGroup;
  }, [fixtures]);

  const maxMatchdays = useMemo(() => {
    let maxMatchday = 0;
    Object.values(allFixtures).forEach(groupFixtures => {
      groupFixtures.forEach(fixture => {
        maxMatchday = Math.max(maxMatchday, fixture.matchday);
      });
    });
    return maxMatchday;
  }, [allFixtures]);

  const getFixturesForMatchday = (groupId: string, matchday: number) => {
    return allFixtures[groupId]?.filter(fixture => fixture.matchday === matchday) || [];
  };

  if (fixtures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Fixtures Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No fixtures scheduled yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Fixtures Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
            {Array.from({ length: maxMatchdays }, (_, i) => i + 1).map((matchday) => (
              <TabsTrigger key={matchday} value={matchday.toString()}>
                MD {matchday}
              </TabsTrigger>
            ))}
          </TabsList>

          {Array.from({ length: maxMatchdays }, (_, i) => i + 1).map((matchday) => (
            <TabsContent key={matchday} value={matchday.toString()} className="space-y-4 mt-4">
              {groups.map((group) => {
                const groupFixtures = getFixturesForMatchday(group.id, matchday);
                if (groupFixtures.length === 0) return null;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{group.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Round {groupFixtures[0]?.round || 1}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupFixtures.map((fixture, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium text-sm flex-1">{fixture.homeTeam}</span>
                          <span className="px-3 text-xs text-muted-foreground font-semibold">VS</span>
                          <span className="font-medium text-sm flex-1 text-right">{fixture.awayTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
