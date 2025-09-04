import React, { useMemo, useState } from 'react';
import { Group } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Fixture {
  homeTeam: string;
  awayTeam: string;
  matchday: number;
  round: number; // 1 for first round, 2 for second round
}

interface FixtureGeneratorProps {
  groups: Group[];
}

const FixtureGenerator: React.FC<FixtureGeneratorProps> = ({ groups }) => {
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const { toast } = useToast();

  const generateDoubleRoundRobin = (teams: string[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const n = teams.length;
    
    if (n < 2) return fixtures;

    // Generate first round (each team plays each other once)
    for (let round = 1; round <= 2; round++) {
      let matchday = 1;
      
      // Use round-robin algorithm
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < Math.floor(n / 2); j++) {
          let home = (i + j) % (n - 1);
          let away = (n - 1 - j + i) % (n - 1);
          
          if (j === 0) {
            away = n - 1;
          }

          // In second round, swap home and away
          if (round === 2) {
            [home, away] = [away, home];
          }

          fixtures.push({
            homeTeam: teams[home],
            awayTeam: teams[away],
            matchday: matchday + (round - 1) * (n - 1),
            round
          });
        }
        matchday++;
      }
    }
    
    return fixtures;
  };

  const allFixtures = useMemo(() => {
    const fixturesByGroup: Record<string, Fixture[]> = {};
    
    groups.forEach(group => {
      if (group.teams.length >= 2) {
        const teamNames = group.teams.map(team => team.name);
        fixturesByGroup[group.id] = generateDoubleRoundRobin(teamNames);
      }
    });
    
    return fixturesByGroup;
  }, [groups]);

  const maxMatchdays = useMemo(() => {
    const maxTeams = Math.max(...groups.map(g => g.teams.length));
    return maxTeams >= 2 ? (maxTeams - 1) * 2 : 0;
  }, [groups]);

  const getFixturesForMatchday = (groupId: string, matchday: number) => {
    return allFixtures[groupId]?.filter(fixture => fixture.matchday === matchday) || [];
  };

  const generateWhatsAppText = (matchday: number) => {
    let text = `🏆 TOURNAMENT FIXTURES - MATCHDAY ${matchday}\n\n`;
    
    groups.forEach(group => {
      const fixtures = getFixturesForMatchday(group.id, matchday);
      if (fixtures.length > 0) {
        text += `📋 ${group.name}\n`;
        fixtures.forEach((fixture, index) => {
          text += `${index + 1}. ${fixture.homeTeam} vs ${fixture.awayTeam}\n`;
        });
        text += '\n';
      }
    });
    
    text += `⚽ Good luck to all teams!\n#Tournament #Matchday${matchday}`;
    return text;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Fixtures copied to clipboard for WhatsApp sharing"
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy fixtures",
        variant: "destructive"
      });
    }
  };

  const downloadFixtures = () => {
    let allText = '🏆 COMPLETE TOURNAMENT FIXTURES\n\n';
    
    for (let md = 1; md <= maxMatchdays; md++) {
      allText += generateWhatsAppText(md) + '\n\n' + '='.repeat(50) + '\n\n';
    }
    
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament_fixtures.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "All fixtures downloaded as text file"
    });
  };

  if (maxMatchdays === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fixture Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Need at least 2 teams per group to generate fixtures.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Fixture Generator - Double Round Robin
          <Button onClick={downloadFixtures} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Matchday Selector */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxMatchdays }, (_, i) => i + 1).map(matchday => (
            <Button
              key={matchday}
              variant={selectedMatchday === matchday ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMatchday(matchday)}
            >
              Matchday {matchday}
            </Button>
          ))}
        </div>

        {/* Current Matchday Fixtures */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Matchday {selectedMatchday} Fixtures</h3>
            <Button 
              onClick={() => copyToClipboard(generateWhatsAppText(selectedMatchday))}
              variant="outline" 
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy for WhatsApp
            </Button>
          </div>

          {groups.map(group => {
            const fixtures = getFixturesForMatchday(group.id, selectedMatchday);
            if (fixtures.length === 0) return null;

            return (
              <div key={group.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold">{group.name}</h4>
                  <Badge variant="secondary">
                    Round {fixtures[0]?.round || 1}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {fixtures.map((fixture, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="font-medium">{fixture.homeTeam}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="font-medium">{fixture.awayTeam}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Preview */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">WhatsApp Preview:</h4>
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {generateWhatsAppText(selectedMatchday)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default FixtureGenerator;