import { useState } from 'react';
import { Group, Team } from '@/types/tournament';
import { initialGroups, createTeam } from '@/data/initialTournamentData';
import GroupTable from '@/components/GroupTable';
import AdminPanel from '@/components/AdminPanel';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const { toast } = useToast();

  const calculateTeamStats = (team: Team, homeMatches: any[], awayMatches: any[]): Team => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    // Home matches
    homeMatches.forEach(match => {
      goalsFor += match.homeScore;
      goalsAgainst += match.awayScore;
      if (match.homeScore > match.awayScore) wins++;
      else if (match.homeScore === match.awayScore) draws++;
      else losses++;
    });

    // Away matches
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
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newTeam = createTeam(`team-${Date.now()}`, teamName);
        return { ...group, teams: [...group.teams, newTeam] };
      }
      return group;
    }));
  };

  const handleRemoveTeam = (groupId: string, teamId: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return { ...group, teams: group.teams.filter(team => team.id !== teamId) };
      }
      return group;
    }));
    toast({ title: "Success", description: "Team removed successfully" });
  };

  const handleEditTeam = (groupId: string, teamId: string, newName: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          teams: group.teams.map(team =>
            team.id === teamId ? { ...team, name: newName } : team
          )
        };
      }
      return group;
    }));
  };

  const handleSubmitScore = (homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, groupId: string) => {
    setGroups(prev => prev.map(group => {
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
    }));
  };

  return (
    <div className="min-h-screen bg-tournament-bg p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Tournament Management</h1>
          <p className="text-muted-foreground">Manage teams and track tournament progress</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {groups.map((group) => (
            <GroupTable key={group.id} group={group} />
          ))}
        </div>

        <AdminPanel
          groups={groups}
          onAddTeam={handleAddTeam}
          onRemoveTeam={handleRemoveTeam}
          onEditTeam={handleEditTeam}
          onSubmitScore={handleSubmitScore}
        />
      </div>
    </div>
  );
};

export default Index;