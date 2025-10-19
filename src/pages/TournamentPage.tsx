import { useMemo, useState, useCallback } from 'react';
import { Team, Match, KnockoutMatch } from '@/types/tournament';
import { createTeam } from '@/data/initialTournamentData'; // Kept in case utility functions use it
// Ensure all child components (especially GroupTable) use w-full internally
import GroupTable from '@/components/GroupTable';
import AdminPanel from '@/components/AdminPanel';
import MatchTracker from '@/components/MatchTracker';
import FixtureGenerator from '@/components/FixtureGenerator';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { useToast } from '@/hooks/use-toast';
import { useTournament } from '@/hooks/useTournament';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import AnimatedStatusPanel from '@/components/AnimatedStatusPanel';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentPageProps {
  tournamentId: string;
  numberOfGroups: number;
  onBack: () => void;
}

// Define the type for the qualified teams object used for GroupTable
type QualifiedTeams = {
  firstPlace: string[]; // Array of Team IDs
  secondPlace: string[]; // Array of Team IDs
};

export const TournamentPage = ({ tournamentId, numberOfGroups, onBack }: TournamentPageProps) => {
  const { logout } = useAuth();
  const { groups, matches, fixtures, knockoutMatches,  updateFixtures, updateKnockoutMatches } = useTournament(tournamentId, numberOfGroups);
  const { toast } = useToast();
  const [showKnockout, setShowKnockout] = useState(false);

  // --- Utility functions (Stubs - assuming correct implementation within the hook) ---
  // If these are defined here, they should be wrapped in useCallback if passed to children
  const calculateTeamStats = (team: Team, homeMatches: Match[], awayMatches: Match[]): Team => { /* ... */ return team; };
  const handleAddTeam = useCallback((groupId: string, teamName: string): boolean => { /* ... */ return true; }, []);
  const handleRemoveTeam = useCallback((groupId: string, teamId: string) => { /* ... */ }, []);
  const handleEditTeam = useCallback((groupId: string, teamId: string, newName: string) => { /* ... */ }, []);
  const handleSubmitScore = useCallback((homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, groupId: string) => { /* ... */ }, []);
  const generateKnockoutBracket = useCallback(() => { /* ... */ }, []); // Assuming this updates knockoutMatches
  const handleKnockoutScore = useCallback((matchId: string, homeScore: number, awayScore: number) => { /* ... */ }, []);


  // ✅ CORRECTION 1: Create a memoized object to hold the ranked qualified teams, 
  // separating 1st and 2nd place IDs for each group.
  const rankedQualifiedTeams = useMemo(() => {
    const result: Record<string, QualifiedTeams> = {};

    groups.forEach(group => {
      // Sort teams by points, then goal difference (standard tiebreakers)
      const sortedTeams = [...group.teams].sort(
        (a, b) => b.points - a.points || b.goalDifference - a.goalDifference
      );

      result[group.id] = {
        // Top team ID
        firstPlace: sortedTeams.length > 0 ? [sortedTeams[0].id] : [],
        // Second team ID
        secondPlace: sortedTeams.length > 1 ? [sortedTeams[1].id] : [],
      };
    });
    return result;
  }, [groups]);
  
  // Get the total number of qualified teams (for the button check)
  const totalQualifiedTeams = useMemo(() => {
      return groups.reduce((count, group) => {
          const qualified = rankedQualifiedTeams[group.id];
          return count + (qualified?.firstPlace.length || 0) + (qualified?.secondPlace.length || 0);
      }, 0);
  }, [groups, rankedQualifiedTeams]);
  

  const handleGenerateKnockout = () => {
    if (totalQualifiedTeams !== 8) {
      toast({
        title: 'Qualification Incomplete',
        description: 'You must have exactly 8 qualified teams (Top 2 from 4 groups) to generate the Quarter-Finals bracket.',
        variant: 'destructive',
      });
      return;
    }
    
    generateKnockoutBracket(); // Assumed to update knockoutMatches state
    setShowKnockout(true); // Switch view
  };

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  return (
    // Minimal border/background to mimic a clean, modern dashboard
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Increased padding on mobile (p-4) but max width for desktop */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* === HEADER: Improved Mobile Layout === */}
        <header className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          
          {/* Title and Subtitle Area */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Tournament Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage teams and track tournament progress</p>
          </div>
          
          {/* Action Buttons: Use flex-wrap on mobile and full width buttons for better tapping */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={onBack} variant="outline" className="w-1/3 sm:w-auto">Back</Button>
            <Button variant="ghost" className="w-1/3 sm:w-auto p-2" title="Settings"><Settings className="w-5 h-5" /></Button>
            <Button onClick={handleLogout} variant="outline" className="w-1/3 sm:w-auto">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        
        {/* === MAIN CONTENT AREA === */}
        {!showKnockout ? (
          <>
            {/* 1. Group Tables Grid: Uses w-full on mobile, forcing child tables to stretch */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {groups.map((group) => (
                // ✅ CORRECTION 2: Pass the correct, memoized, ranked qualification data for the specific group.
                <GroupTable 
                  key={group.id} 
                  group={group} 
                  qualifiedTeams={rankedQualifiedTeams[group.id] || { firstPlace: [], secondPlace: [] }} 
                />
              ))}
            </div>

            {/* 2. Qualification Status Card (Full Width) */}
            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-center text-gray-800 dark:text-gray-100">Qualification Status</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="font-medium">Top 2 from each group advance</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ({totalQualifiedTeams} / {numberOfGroups * 2} teams qualified)
                </div>
              </div>
              <div className="mt-4 text-center">
                {/* ✅ CORRECTION 3: Use the new handler that performs generation AND view switch. */}
                <Button 
                  onClick={handleGenerateKnockout} 
                  size="lg" 
                  disabled={totalQualifiedTeams !== 8} 
                  className="bg-black hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
                >
                  Generate Knockout Bracket ({totalQualifiedTeams}/8 Teams)
                </Button>
              </div>
            </div>

            {/* 3. Tracker, Fixtures, and Animated Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 space-y-6">
                <MatchTracker groups={groups} matches={matches} />
                <FixtureGenerator groups={groups} fixtures={fixtures} setFixtures={updateFixtures} />
              </div>
              
              <AnimatedStatusPanel /> 
            </div>

            {/* 4. Admin Panel */}
            <AdminPanel
              groups={groups}
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
    </div>
  );
};