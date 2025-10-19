import { useMemo, useState } from 'react';
import { Team, Match, KnockoutMatch } from '@/types/tournament';
import { createTeam } from '@/data/initialTournamentData';
import GroupTable from '@/components/GroupTable';
import AdminPanel from '@/components/AdminPanel';
import MatchTracker from '@/components/MatchTracker';
import FixtureGenerator from '@/components/FixtureGenerator';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { useToast } from '@/hooks/use-toast';
import { useTournament } from '@/hooks/useTournament';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface TournamentPageProps {
  tournamentId: string;
  numberOfGroups: number;
  onBack: () => void;
}

export const TournamentPage = ({ tournamentId, numberOfGroups, onBack }: TournamentPageProps) => {
  const { logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { groups, matches, fixtures, knockoutMatches, updateGroups, updateMatches, updateFixtures, updateKnockoutMatches } = useTournament(tournamentId, numberOfGroups);
  const { toast } = useToast();
  const [showKnockout, setShowKnockout] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const calculateTeamStats = (team: Team, homeMatches: any[], awayMatches: any[]): Team => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    homeMatches.forEach(match => {
      goalsFor += match.homeScore;
      goalsAgainst += match.awayScore;
      if (match.homeScore > match.awayScore) wins++;
      else if (match.homeScore === match.awayScore) draws++;
      else losses++;
    });

    awayMatches.forEach(match => {
      goalsFor += match.awayScore;
      goalsAgainst += match.homeScore;
      if (match.awayScore > match.homeScore) wins++;
      else if (match.awayScore === match.homeScore) draws++;
      else losses++;
    });

    return {
      ...team,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points: wins * 3 + draws,
      goalDifference: goalsFor - goalsAgainst,
    };
  };

  const handleAddTeam = (groupId: string, teamName: string) => {
    const targetGroup = groups.find(g => g.id === groupId);
    
    if (!targetGroup) {
      toast({ 
        title: "Error", 
        description: "Group not found",
        variant: "destructive" 
      });
      return;
    }

    if (targetGroup.teams.length >= 4) {
      toast({ 
        title: "Error", 
        description: "Maximum 4 teams per group. Limit reached.",
        variant: "destructive" 
      });
      return;
    }
    
    // Check for duplicates across ALL groups
    const isDuplicate = groups.some(group => 
      group.teams.some(team => team.name.toLowerCase() === teamName.toLowerCase())
    );
    
    if (isDuplicate) {
      toast({ 
        title: "Error", 
        description: "A team with this name already exists in the tournament",
        variant: "destructive" 
      });
      return;
    }

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const newTeam = createTeam(`team-${Date.now()}`, teamName);
        return { ...group, teams: [...group.teams, newTeam] };
      }
      return group;
    });
    updateGroups(updatedGroups);
    toast({ title: "Success", description: "Team added successfully" });
  };

  const handleRemoveTeam = (groupId: string, teamId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, teams: group.teams.filter(team => team.id !== teamId) };
      }
      return group;
    });
    updateGroups(updatedGroups);
    toast({ title: "Success", description: "Team removed successfully" });
  };

  const handleEditTeam = (groupId: string, teamId: string, newName: string) => {
    const targetGroup = groups.find(g => g.id === groupId);
    const currentTeamName = targetGroup?.teams.find(team => team.id === teamId)?.name;

    // Check for duplicates across ALL groups (excluding the current team being edited)
    const isDuplicate = groups.some(group => 
      group.teams.some(team => team.id !== teamId && team.name.toLowerCase() === newName.toLowerCase())
    );
    
    if (isDuplicate) {
      toast({ 
        title: "Error", 
        description: "A team with this name already exists in the tournament",
        variant: "destructive" 
      });
      return;
    }

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          teams: group.teams.map(team =>
            team.id === teamId ? { ...team, name: newName } : team
          )
        };
      }
      return group;
    });
    updateGroups(updatedGroups);
    toast({ title: "Success", description: "Team updated successfully" });

    if (currentTeamName) {
      const updatedFixtures = fixtures.map(fixture => ({
        ...fixture,
        homeTeam: fixture.homeTeam === currentTeamName ? newName : fixture.homeTeam,
        awayTeam: fixture.awayTeam === currentTeamName ? newName : fixture.awayTeam
      }));
      updateFixtures(updatedFixtures);
    }
  };

  const handleSubmitScore = (homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, groupId: string) => {
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      homeTeam: homeTeamId,
      awayTeam: awayTeamId,
      homeScore,
      awayScore,
      groupId,
      date: new Date().toISOString(),
    };

    updateMatches([...matches, newMatch]);

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedTeams = group.teams.map(team => {
          if (team.id === homeTeamId) {
            const goalsFor = team.goalsFor + homeScore;
            const goalsAgainst = team.goalsAgainst + awayScore;
            let wins = team.wins;
            let draws = team.draws;
            let losses = team.losses;

            if (homeScore > awayScore) wins++;
            else if (homeScore === awayScore) draws++;
            else losses++;

            return {
              ...team,
              wins,
              draws,
              losses,
              goalsFor,
              goalsAgainst,
              points: wins * 3 + draws,
              goalDifference: goalsFor - goalsAgainst,
            };
          }
          
          if (team.id === awayTeamId) {
            const goalsFor = team.goalsFor + awayScore;
            const goalsAgainst = team.goalsAgainst + homeScore;
            let wins = team.wins;
            let draws = team.draws;
            let losses = team.losses;

            if (awayScore > homeScore) wins++;
            else if (awayScore === homeScore) draws++;
            else losses++;

            return {
              ...team,
              wins,
              draws,
              losses,
              goalsFor,
              goalsAgainst,
              points: wins * 3 + draws,
              goalDifference: goalsFor - goalsAgainst,
            };
          }
          
          return team;
        });
        
        return { ...group, teams: updatedTeams };
      }
      return group;
    });
    updateGroups(updatedGroups);
  };

  const qualifiedTeams = useMemo(() => {
    const top2Teams = groups.flatMap(group => {
      const sortedTeams = [...group.teams].sort((a, b) => 
        b.points - a.points || b.goalDifference - a.goalDifference
      );
      return sortedTeams.slice(0, 2).map(team => ({ ...team, groupId: group.id }));
    });

    return top2Teams.map(team => team.id);
  }, [groups]);

  const generateKnockoutBracket = () => {
    const top2Teams = groups.flatMap(group => {
      const sortedTeams = [...group.teams].sort((a, b) => 
        b.points - a.points || b.goalDifference - a.goalDifference
      );
      return sortedTeams.slice(0, 2).map((team, idx) => ({ 
        ...team, 
        groupId: group.id, 
        position: idx + 1 
      }));
    });

    if (top2Teams.length !== numberOfGroups * 2) {
      toast({ 
        title: "Error", 
        description: "Group stage must be complete to generate knockout bracket",
        variant: "destructive" 
      });
      return;
    }

    const quarters: KnockoutMatch[] = [
      { id: 'q1', homeTeam: top2Teams[0].name, awayTeam: top2Teams[5].name, homeScore: null, awayScore: null, round: 'quarter', matchNumber: 1 },
      { id: 'q2', homeTeam: top2Teams[2].name, awayTeam: top2Teams[7].name, homeScore: null, awayScore: null, round: 'quarter', matchNumber: 2 },
      { id: 'q3', homeTeam: top2Teams[4].name, awayTeam: top2Teams[3].name, homeScore: null, awayScore: null, round: 'quarter', matchNumber: 3 },
      { id: 'q4', homeTeam: top2Teams[6].name, awayTeam: top2Teams[1].name, homeScore: null, awayScore: null, round: 'quarter', matchNumber: 4 },
    ];

    const semis: KnockoutMatch[] = [
      { id: 's1', homeTeam: '', awayTeam: '', homeScore: null, awayScore: null, round: 'semi', matchNumber: 1 },
      { id: 's2', homeTeam: '', awayTeam: '', homeScore: null, awayScore: null, round: 'semi', matchNumber: 2 },
    ];

    const final: KnockoutMatch = { 
      id: 'f1', 
      homeTeam: '', 
      awayTeam: '', 
      homeScore: null, 
      awayScore: null, 
      round: 'final', 
      matchNumber: 1 
    };

    updateKnockoutMatches([...quarters, ...semis, final]);
    setShowKnockout(true);
    toast({ title: "Success", description: "Knockout bracket generated!" });
  };

  const handleKnockoutScore = (matchId: string, homeScore: number, awayScore: number) => {
    const updatedKnockout = knockoutMatches.map(match => {
      if (match.id === matchId) {
        return { ...match, homeScore, awayScore };
      }
      return match;
    });

    const completedMatch = updatedKnockout.find(m => m.id === matchId);
    if (completedMatch && completedMatch.homeScore !== null && completedMatch.awayScore !== null) {
      const winner = completedMatch.homeScore > completedMatch.awayScore 
        ? completedMatch.homeTeam 
        : completedMatch.awayTeam;

      if (matchId.startsWith('q')) {
        const quarterNum = parseInt(matchId.substring(1));
        const semiIdx = quarterNum <= 2 ? 0 : 1;
        const semiMatch = updatedKnockout.find(m => m.id === `s${semiIdx + 1}`);
        
        if (semiMatch) {
          if (quarterNum % 2 === 1) {
            semiMatch.homeTeam = winner;
          } else {
            semiMatch.awayTeam = winner;
          }
        }
      } else if (matchId.startsWith('s')) {
        const semiNum = parseInt(matchId.substring(1));
        const finalMatch = updatedKnockout.find(m => m.id === 'f1');
        
        if (finalMatch) {
          if (semiNum === 1) {
            finalMatch.homeTeam = winner;
          } else {
            finalMatch.awayTeam = winner;
          }
        }
      }
    }

    updateKnockoutMatches(updatedKnockout);
  };

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  const handleResetTournament = async () => {
    try {
      // Delete all subcollections data
      const collections = ['groups', 'matches', 'fixtures', 'knockout'];
      
      for (const collectionName of collections) {
        const subCollectionRef = collection(db, 'tournaments', tournamentId, collectionName);
        const snapshot = await getDocs(subCollectionRef);
        
        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, 'tournaments', tournamentId, collectionName, document.id));
        }
      }

      setShowKnockout(false);
      toast({ title: "Success", description: "Tournament reset successfully. You can now start fresh!" });
      setResetDialogOpen(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to reset tournament",
        variant: "destructive" 
      });
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-primary mb-2">Tournament Management</h1>
            <p className="text-muted-foreground">Manage teams and track tournament progress</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => setResetDialogOpen(true)} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Tournament
              </Button>
            )}
            <Button onClick={onBack} variant="outline">Back</Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {!showKnockout ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {groups.slice(0, numberOfGroups).map((group) => (
                <GroupTable key={group.id} group={group} qualifiedTeams={{ firstPlace: qualifiedTeams, secondPlace: [] }} />
              ))}
            </div>

            <div className="mb-6 p-4 bg-card rounded-xl border border-border">
              <h3 className="text-lg font-semibold mb-3 text-center">Qualification Status</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-qualified-first rounded"></div>
                  <span className="text-sm font-medium">Top 2 from each group advance</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {numberOfGroups * 2} teams advance to Quarter-Finals
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button onClick={generateKnockoutBracket} size="lg">
                  Generate Knockout Bracket
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MatchTracker groups={groups} matches={matches} />
              <FixtureGenerator groups={groups.slice(0, numberOfGroups)} fixtures={fixtures} setFixtures={updateFixtures} />
            </div>

            <AdminPanel
              groups={groups.slice(0, numberOfGroups)}
              onAddTeam={handleAddTeam}
              onRemoveTeam={handleRemoveTeam}
              onEditTeam={handleEditTeam}
              onSubmitScore={handleSubmitScore}
            />
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <Button onClick={() => setShowKnockout(false)} variant="outline">
                Back to Group Stage
              </Button>
            </div>
            <KnockoutBracket matches={knockoutMatches} onUpdateScore={handleKnockoutScore} />
          </>
        )}
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this tournament? This will permanently delete all teams, matches, fixtures, and knockout data. You will start with a clean slate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTournament} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
