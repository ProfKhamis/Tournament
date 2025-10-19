import { Group, Team } from '@/types/tournament';

interface GroupTableProps {
  group: Group;
  qualifiedTeams: {
    firstPlace: string[];
    secondPlace: string[];
  };
}

const GroupTable = ({ group, qualifiedTeams }: GroupTableProps) => {
  const getTeamHighlight = (team: Team, position: number) => {
    // Check for FIRST PLACE
    if (qualifiedTeams.firstPlace.includes(team.id)) {
      return { 
        rowClass: "bg-qualified-first-bg border-l-4 border-qualified-first", 
        badge: "1ST" // <-- Correctly marks 1st place
      };
    }
    // Check for SECOND PLACE
    if (qualifiedTeams.secondPlace.includes(team.id)) {
      return { 
        rowClass: "bg-qualified-second-bg border-l-4 border-qualified-second", 
        badge: "2ND" // ✅ FIX: Changed badge from "Q" to "2ND"
      };
    }
    return {
      rowClass: "",
      badge: null
    };
  };
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <h2 className="text-xl font-semibold text-tournament-header mb-6 text-center">
        {group.name}
      </h2>
      
      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-tournament-table-header pb-3 border-b border-border/20">
          <div className="col-span-6 text-left">TEAM</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">GD</div>
          <div className="col-span-2 text-center">PTS</div>
        </div>
        
        {/* Teams */}
        {group.teams
          .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
          .map((team, index) => {
            const highlight = getTeamHighlight(team, index);
            return (
              <div key={team.id} className={`grid grid-cols-12 gap-2 text-sm py-3 hover:bg-muted/30 transition-colors rounded-lg ${highlight.rowClass}`}>
                <div className="col-span-6 font-medium text-foreground text-left truncate pr-4 flex items-center gap-2">
                  {team.name}
                  {highlight.badge && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      highlight.badge === "1ST" 
                        ? "bg-qualified-first text-white" 
                        : "bg-qualified-second text-white"
                    }`}>
                      {highlight.badge}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center text-foreground font-medium">{team.wins}</div>
                <div className="col-span-1 text-center text-foreground font-medium">{team.draws}</div>
                <div className="col-span-1 text-center text-foreground font-medium">{team.losses}</div>
                <div className="col-span-1 text-center text-foreground font-medium">{team.goalDifference}</div>
                <div className="col-span-2 text-center font-semibold text-foreground">{team.points}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default GroupTable;