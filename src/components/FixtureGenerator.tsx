import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Group, Fixture } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Image, RefreshCw, Lock, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FixtureGeneratorProps {
  groups: Group[];
  fixtures: Fixture[];
  setFixtures: (fixtures: Fixture[]) => void;
}

const FixtureGenerator: React.FC<FixtureGeneratorProps> = ({ groups, fixtures, setFixtures }) => {
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1);
  const [fixturesGenerated, setFixturesGenerated] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Fair Round Robin Algorithm - ensures each team plays all others exactly once per round
  const generateDoubleRoundRobin = (teams: string[], groupId: string): Fixture[] => {
    const fixtures: Fixture[] = [];
    const n = teams.length;
    
    if (n < 2) return fixtures;

    const sortedTeams = [...teams].sort();

    for (let round = 1; round <= 2; round++) {
      const roundFixtures: Fixture[] = [];
      
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const isFirstRound = round === 1;
          roundFixtures.push({
            homeTeam: isFirstRound ? sortedTeams[i] : sortedTeams[j],
            awayTeam: isFirstRound ? sortedTeams[j] : sortedTeams[i],
            matchday: 0, 
            round,
            groupId
          });
        }
      }

      const matchdays: Fixture[][] = [];
      const teamMatchdays: Map<string, Set<number>> = new Map();
      
      sortedTeams.forEach(team => teamMatchdays.set(team, new Set()));
      
      roundFixtures.forEach(fixture => {
        let assignedMatchday = -1;
        
        for (let md = 0; md < matchdays.length; md++) {
          const homeTeamBusy = teamMatchdays.get(fixture.homeTeam)?.has(md);
          const awayTeamBusy = teamMatchdays.get(fixture.awayTeam)?.has(md);
          
          if (!homeTeamBusy && !awayTeamBusy) {
            assignedMatchday = md;
            break;
          }
        }
        
        if (assignedMatchday === -1) {
          assignedMatchday = matchdays.length;
          matchdays.push([]);
        }      
        // Adjust Matchday number based on the round
        const matchdayOffset = (round - 1) * (n % 2 === 0 ? n - 1 : n); // Logic for round robin matchday counting
        fixture.matchday = assignedMatchday + 1 + matchdayOffset;
        
        matchdays[assignedMatchday].push(fixture);
        teamMatchdays.get(fixture.homeTeam)?.add(assignedMatchday);
        teamMatchdays.get(fixture.awayTeam)?.add(assignedMatchday);

      });
      
      fixtures.push(...roundFixtures);
    }
    
    return fixtures;
  };


  const generateAllFixtures = () => {
    const allFixtures: Fixture[] = [];
    
    groups.forEach(group => {      
        const realTeams = group.teams.filter(team => {
            const teamName = team.name.trim().toUpperCase();
            const groupName = group.name.toUpperCase();            
            // Simple check to exclude default/placeholder team names
            if (!teamName || teamName.includes('TEAM') || teamName.includes(groupName)) {
                return false; 
            }
            return true;
        });
        
        if (realTeams.length >= 2) {
            const teamNames = realTeams.map(team => team.name);
            
            const groupFixtures = generateDoubleRoundRobin(teamNames, group.id);
            allFixtures.push(...groupFixtures);
        } else {
            console.warn(`Skipping fixture generation for ${group.name}: Only ${realTeams.length} real team(s) found.`);
        }
    });
    
    setFixtures(allFixtures);
    setFixturesGenerated(true);
    setSelectedMatchday(1); // Reset to first matchday on regenerate
    toast({
        title: "Fixtures Generated!",
        description: "Tournament fixtures have been created and locked."
    });
  };

  const setOriginalFixtures = () => {
    // ... (Original fixtures data remains unchanged)
    const originalFixtures: Fixture[] = [
        // MATCHDAY 1 - EXACT AS WHATSAPP IMAGE
        // Group A fixtures
        { homeTeam: "LEGEND KILLER", awayTeam: "MBOMBOCLAT", matchday: 1, round: 1, groupId: "group-a" },
        { homeTeam: "ÇEASER", awayTeam: "TYCOON", matchday: 1, round: 1, groupId: "group-a" },
        
        // Group B fixtures  
        { homeTeam: "PUMAS FC", awayTeam: "FCMKHI99", matchday: 1, round: 1, groupId: "group-b" },
        { homeTeam: "SCAVANGERS", awayTeam: "VJMOHANZE", matchday: 1, round: 1, groupId: "group-b" },
        
        // Group C fixtures
        { homeTeam: "JEONJU G", awayTeam: "A-L-F-R-3-D", matchday: 1, round: 1, groupId: "group-c" },
        { homeTeam: "FARO BV", awayTeam: "CHELSEA", matchday: 1, round: 1, groupId: "group-c" },
        
        // Group D fixtures
        { homeTeam: "THE RALPH", awayTeam: "MANCHESTER UNITED", matchday: 1, round: 1, groupId: "group-d" },
        { homeTeam: "LONDON BUOY", awayTeam: "SHAKUR254", matchday: 1, round: 1, groupId: "group-d" },
        
        // Group E fixtures
        { homeTeam: "HAVE MERCY", awayTeam: "PERFECT COMBI", matchday: 1, round: 1, groupId: "group-e" },
        { homeTeam: "ALLAN FC", awayTeam: "ÜNRÜLLY", matchday: 1, round: 1, groupId: "group-e" },

        // REMAINING MATCHDAYS - Round 1 continues
        { homeTeam: "TYCOON", awayTeam: "MBOMBOCLAT", matchday: 2, round: 1, groupId: "group-a" },
        { homeTeam: "LEGEND KILLER", awayTeam: "ÇEASER", matchday: 2, round: 1, groupId: "group-a" },
        { homeTeam: "VJMOHANZE", awayTeam: "FCMKHI99", matchday: 2, round: 1, groupId: "group-b" },
        { homeTeam: "PUMAS FC", awayTeam: "SCAVANGERS", matchday: 2, round: 1, groupId: "group-b" },
        { homeTeam: "CHELSEA", awayTeam: "A-L-F-R-3-D", matchday: 2, round: 1, groupId: "group-c" },
        { homeTeam: "JEONJU G", awayTeam: "FARO BV", matchday: 2, round: 1, groupId: "group-c" },
        { homeTeam: "SHAKUR254", awayTeam: "MANCHESTER UNITED", matchday: 2, round: 1, groupId: "group-d" },
        { homeTeam: "THE RALPH", awayTeam: "LONDON BUOY", matchday: 2, round: 1, groupId: "group-d" },
        { homeTeam: "ÜNRÜLLY", awayTeam: "PERFECT COMBI", matchday: 2, round: 1, groupId: "group-e" },
        { homeTeam: "HAVE MERCY", awayTeam: "ALLAN FC", matchday: 2, round: 1, groupId: "group-e" },

        { homeTeam: "MBOMBOCLAT", awayTeam: "ÇEASER", matchday: 3, round: 1, groupId: "group-a" },
        { homeTeam: "TYCOON", awayTeam: "LEGEND KILLER", matchday: 3, round: 1, groupId: "group-a" },
        { homeTeam: "FCMKHI99", awayTeam: "SCAVANGERS", matchday: 3, round: 1, groupId: "group-b" },
        { homeTeam: "VJMOHANZE", awayTeam: "PUMAS FC", matchday: 3, round: 1, groupId: "group-b" },
        { homeTeam: "A-L-F-R-3-D", awayTeam: "FARO BV", matchday: 3, round: 1, groupId: "group-c" },
        { homeTeam: "CHELSEA", awayTeam: "JEONJU G", matchday: 3, round: 1, groupId: "group-c" },
        { homeTeam: "MANCHESTER UNITED", awayTeam: "LONDON BUOY", matchday: 3, round: 1, groupId: "group-d" },
        { homeTeam: "SHAKUR254", awayTeam: "THE RALPH", matchday: 3, round: 1, groupId: "group-d" },
        { homeTeam: "PERFECT COMBI", awayTeam: "ALLAN FC", matchday: 3, round: 1, groupId: "group-e" },
        { homeTeam: "ÜNRÜLLY", awayTeam: "HAVE MERCY", matchday: 3, round: 1, groupId: "group-e" },
        
        // ROUND 2 FIXTURES - Home/Away reversed
        { homeTeam: "MBOMBOCLAT", awayTeam: "LEGEND KILLER", matchday: 4, round: 2, groupId: "group-a" },
        { homeTeam: "TYCOON", awayTeam: "ÇEASER", matchday: 4, round: 2, groupId: "group-a" },
        { homeTeam: "FCMKHI99", awayTeam: "PUMAS FC", matchday: 4, round: 2, groupId: "group-b" },
        { homeTeam: "VJMOHANZE", awayTeam: "SCAVANGERS", matchday: 4, round: 2, groupId: "group-b" },
        { homeTeam: "A-L-F-R-3-D", awayTeam: "JEONJU G", matchday: 4, round: 2, groupId: "group-c" },
        { homeTeam: "CHELSEA", awayTeam: "FARO BV", matchday: 4, round: 2, groupId: "group-c" },
        { homeTeam: "MANCHESTER UNITED", awayTeam: "THE RALPH", matchday: 4, round: 2, groupId: "group-d" },
        { homeTeam: "SHAKUR254", awayTeam: "LONDON BUOY", matchday: 4, round: 2, groupId: "group-d" },
        { homeTeam: "PERFECT COMBI", awayTeam: "HAVE MERCY", matchday: 4, round: 2, groupId: "group-e" },
        { homeTeam: "ÜNRÜLLY", awayTeam: "ALLAN FC", matchday: 4, round: 2, groupId: "group-e" },

        { homeTeam: "MBOMBOCLAT", awayTeam: "TYCOON", matchday: 5, round: 2, groupId: "group-a" },
        { homeTeam: "ÇEASER", awayTeam: "LEGEND KILLER", matchday: 5, round: 2, groupId: "group-a" },
        { homeTeam: "FCMKHI99", awayTeam: "VJMOHANZE", matchday: 5, round: 2, groupId: "group-b" },
        { homeTeam: "SCAVANGERS", awayTeam: "PUMAS FC", matchday: 5, round: 2, groupId: "group-b" },
        { homeTeam: "A-L-F-R-3-D", awayTeam: "CHELSEA", matchday: 5, round: 2, groupId: "group-c" },
        { homeTeam: "FARO BV", awayTeam: "JEONJU G", matchday: 5, round: 2, groupId: "group-c" },
        { homeTeam: "MANCHESTER UNITED", awayTeam: "SHAKUR254", matchday: 5, round: 2, groupId: "group-d" },
        { homeTeam: "LONDON BUOY", awayTeam: "THE RALPH", matchday: 5, round: 2, groupId: "group-d" },
        { homeTeam: "PERFECT COMBI", awayTeam: "ÜNRÜLLY", matchday: 5, round: 2, groupId: "group-e" },
        { homeTeam: "ALLAN FC", awayTeam: "HAVE MERCY", matchday: 5, round: 2, groupId: "group-e" },

        { homeTeam: "ÇEASER", awayTeam: "MBOMBOCLAT", matchday: 6, round: 2, groupId: "group-a" },
        { homeTeam: "LEGEND KILLER", awayTeam: "TYCOON", matchday: 6, round: 2, groupId: "group-a" },
        { homeTeam: "SCAVANGERS", awayTeam: "FCMKHI99", matchday: 6, round: 2, groupId: "group-b" },
        { homeTeam: "PUMAS FC", awayTeam: "VJMOHANZE", matchday: 6, round: 2, groupId: "group-b" },
        { homeTeam: "FARO BV", awayTeam: "A-L-F-R-3-D", matchday: 6, round: 2, groupId: "group-c" },
        { homeTeam: "JEONJU G", awayTeam: "CHELSEA", matchday: 6, round: 2, groupId: "group-c" },
        { homeTeam: "LONDON BUOY", awayTeam: "MANCHESTER UNITED", matchday: 6, round: 2, groupId: "group-d" },
        { homeTeam: "THE RALPH", awayTeam: "SHAKUR254", matchday: 6, round: 2, groupId: "group-d" },
        { homeTeam: "ALLAN FC", awayTeam: "PERFECT COMBI", matchday: 6, round: 2, groupId: "group-e" },
        { homeTeam: "HAVE MERCY", awayTeam: "ÜNRÜLLY", matchday: 6, round: 2, groupId: "group-e" },
    ];

    setFixtures(originalFixtures);
    setFixturesGenerated(true);
    setSelectedMatchday(1); // Reset to first matchday when loading originals
    toast({
      title: "Original Fixtures Set!",
      description: "Fixtures matching the WhatsApp announcement have been loaded."
    });
  };

  // Check if fixtures exist and are current
  useEffect(() => {
    if (fixtures.length > 0) {
      setFixturesGenerated(true);
    }
  }, [fixtures]);

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
      allText += `\n${'='.repeat(20)} MATCHDAY ${md} ${'='.repeat(20)}\n\n`; // Added separator
      allText += generateWhatsAppText(md) + '\n';
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
        
        // Use a fixed width for the home team to better align 'vs'
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
    // Re-draw canvas when selected matchday or fixtures change
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

  if (!fixturesGenerated && maxMatchdays === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fixture Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Need at least 2 teams per group to generate fixtures.</p>
          {groups.some(group => group.teams.length >= 2) && (
            <div className="flex flex-col gap-2"> {/* Use flex-col for stacking on mobile */}
              <Button onClick={setOriginalFixtures} className="w-full" variant="default">
                <Upload className="w-4 h-4 mr-2" />
                Use Original WhatsApp Fixtures
              </Button>
              <Button onClick={generateAllFixtures} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Tournament Fixtures
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!fixturesGenerated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fixture Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Tournament fixtures not yet generated.</p>
          <div className="flex flex-col gap-2"> {/* Use flex-col for stacking on mobile */}
            <Button onClick={setOriginalFixtures} className="w-full" variant="default">
              <Upload className="w-4 h-4 mr-2" />
              Use Original WhatsApp Fixtures
            </Button>
            <Button onClick={generateAllFixtures} className="w-full" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Tournament Fixtures
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4">
          {/* TOP HEADER: Title, Lock, and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">
                Tournament Fixtures
              </CardTitle>
              <Lock className="w-4 h-4 text-green-600" />
            </div>
            {/* Action Buttons: Stack on mobile (flex-col) and switch to row on large screens (lg:flex-row) */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"> 
              <Button onClick={downloadCanvasImage} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Save Image</span>
                <span className="sm:hidden">Image</span>
              </Button>
              <Button onClick={downloadFixtures} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download All</span>
                <span className="sm:hidden">Download</span>
              </Button>
              <Button onClick={generateAllFixtures} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Regenerate</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </div>
          </div>
          
          {/* Badge Status Section: Uses flex-wrap to handle narrow screens */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="px-3 py-1">
              Double Round Robin
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-green-600 border-green-600">
              Fixtures Locked
            </Badge>
            <span className="text-muted-foreground flex-1 min-w-0"> {/* flex-1 helps text wrap */}
              Each team plays all others twice (home & away)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matchday Selector Grid: Tighter on mobile, expands on larger screens */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Select Matchday</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: maxMatchdays }, (_, i) => i + 1).map(matchday => (
              <Button
                key={matchday}
                variant={selectedMatchday === matchday ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMatchday(matchday)}
                className="w-full"
              >
                MD {matchday}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Matchday Fixtures */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Matchday {selectedMatchday} Fixtures</h3>
            <Button 
              onClick={() => copyToClipboard(generateWhatsAppText(selectedMatchday))}
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy for WhatsApp
            </Button>
          </div>

          <div className="grid gap-4">{groups.map(group => {
            const fixtures = getFixturesForMatchday(group.id, selectedMatchday);
            if (fixtures.length === 0) return null;

            return (
              <div key={group.id} className="border rounded-lg p-4 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-base">{group.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    Round {fixtures[0]?.round || 1}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  {fixtures.map((fixture, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded border border-border/50 hover:border-border transition-colors"
                    >
                      <span className="font-medium text-sm text-left flex-1">{fixture.homeTeam}</span>
                      <div className="flex items-center mx-2">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">vs</span>
                      </div>
                      <span className="font-medium text-sm text-right flex-1">{fixture.awayTeam}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Canvas Fixture Display: Wrapped in an overflow container for mobile scrolling */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Visual Fixture Display (for sharing)</h3>
          <div className="border rounded-lg overflow-hidden bg-card/30">
            <div className="overflow-x-auto max-h-[600px] p-2"> {/* Added overflow-x-auto here */}
              <canvas 
                ref={canvasRef}
                className="border rounded bg-white shadow-sm"
                // The canvas width remains 800px to maintain quality, but the parent container handles scrolling on small screens.
                style={{ display: 'block', margin: '0 auto', maxWidth: '800px' }} 
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Preview */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">WhatsApp Preview</h3>
          <div className="border rounded-lg p-4 bg-muted/30">
            <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed">
              {generateWhatsAppText(selectedMatchday)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FixtureGenerator;