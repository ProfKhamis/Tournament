import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Group } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Image } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Fair Round Robin Algorithm - ensures each team plays all others exactly once per round
  const generateDoubleRoundRobin = (teams: string[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const n = teams.length;
    
    if (n < 2) return fixtures;

    // Create proper round-robin schedule
    for (let round = 1; round <= 2; round++) {
      const roundFixtures: Fixture[] = [];
      
      // Generate all possible pairings
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const isFirstRound = round === 1;
          roundFixtures.push({
            homeTeam: isFirstRound ? teams[i] : teams[j],
            awayTeam: isFirstRound ? teams[j] : teams[i],
            matchday: 0, // Will be assigned below
            round
          });
        }
      }

      // Distribute fixtures across matchdays to ensure fairness
      const matchdays: Fixture[][] = [];
      const teamMatchdays: Map<string, Set<number>> = new Map();
      
      // Initialize team tracking
      teams.forEach(team => teamMatchdays.set(team, new Set()));
      
      roundFixtures.forEach(fixture => {
        let assignedMatchday = -1;
        
        // Find a matchday where both teams are available
        for (let md = 0; md < matchdays.length; md++) {
          const homeTeamBusy = teamMatchdays.get(fixture.homeTeam)?.has(md);
          const awayTeamBusy = teamMatchdays.get(fixture.awayTeam)?.has(md);
          
          if (!homeTeamBusy && !awayTeamBusy) {
            assignedMatchday = md;
            break;
          }
        }
        
        // If no existing matchday works, create a new one
        if (assignedMatchday === -1) {
          assignedMatchday = matchdays.length;
          matchdays.push([]);
        }
        
        // Assign fixture and mark teams as busy
        fixture.matchday = assignedMatchday + 1 + (round - 1) * (n - 1);
        matchdays[assignedMatchday].push(fixture);
        teamMatchdays.get(fixture.homeTeam)?.add(assignedMatchday);
        teamMatchdays.get(fixture.awayTeam)?.add(assignedMatchday);

      });
      
      fixtures.push(...roundFixtures);
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

  // Canvas drawing function for fixtures
  const drawFixturesToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate required height based on content
    let estimatedHeight = 100; // Initial space for title
    groups.forEach(group => {
      const fixtures = getFixturesForMatchday(group.id, selectedMatchday);
      if (fixtures.length > 0) {
        estimatedHeight += 70 + (fixtures.length * 45) + 20; // Group header + fixtures + spacing
      }
    });
    estimatedHeight += 50; // Footer space

    // Set canvas size with dynamic height
    canvas.width = 800;
    canvas.height = Math.max(600, estimatedHeight);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`MATCHDAY ${selectedMatchday} FIXTURES`, canvas.width / 2, 40);

    let yPos = 80;
    const groupColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    groups.forEach((group, groupIndex) => {
      const fixtures = getFixturesForMatchday(group.id, selectedMatchday);
      if (fixtures.length === 0) return;

      // Group header
      ctx.fillStyle = groupColors[groupIndex % groupColors.length];
      ctx.fillRect(50, yPos - 5, canvas.width - 100, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${group.name} - Round ${fixtures[0]?.round || 1}`, 60, yPos + 15);

      yPos += 40;

      // Fixtures
      fixtures.forEach((fixture, index) => {
        // Match box
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(60, yPos, canvas.width - 120, 35);
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.strokeRect(60, yPos, canvas.width - 120, 35);

        // Team names
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(fixture.homeTeam, 70, yPos + 20);
        
        ctx.textAlign = 'center';
        ctx.fillText('vs', canvas.width / 2, yPos + 20);
        
        ctx.textAlign = 'right';
        ctx.fillText(fixture.awayTeam, canvas.width - 70, yPos + 20);

        yPos += 45;
      });

      yPos += 20;
    });

    // Footer
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Designed By ProfKhamis - Kirinyaga University', canvas.width / 2, canvas.height - 20);
  };

  useEffect(() => {
    drawFixturesToCanvas();
  }, [selectedMatchday, groups, allFixtures]);

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `matchday-${selectedMatchday}-fixtures.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Downloaded!",
      description: `Matchday ${selectedMatchday} fixtures saved as image`
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
          Fair Fixture Generator - Double Round Robin
          <div className="flex gap-2">
            <Button onClick={downloadCanvasImage} variant="outline" size="sm">
              <Image className="w-4 h-4 mr-2" />
              Save Image
            </Button>
            <Button onClick={downloadFixtures} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
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

        {/* Canvas Fixture Display */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Visual Fixtures:</h4>
          <div className="overflow-auto max-h-[600px]">
            <canvas 
              ref={canvasRef}
              className="border rounded"
              style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
            />
          </div>
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