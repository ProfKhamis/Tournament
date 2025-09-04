import { Group } from '@/types/tournament';

interface GroupTableProps {
  group: Group;
}

const GroupTable = ({ group }: GroupTableProps) => {
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
          .map((team) => (
            <div key={team.id} className="grid grid-cols-12 gap-2 text-sm py-3 hover:bg-muted/30 transition-colors">
              <div className="col-span-6 font-medium text-foreground text-left truncate pr-4">
                {team.name}
              </div>
              <div className="col-span-1 text-center text-foreground font-medium">{team.wins}</div>
              <div className="col-span-1 text-center text-foreground font-medium">{team.draws}</div>
              <div className="col-span-1 text-center text-foreground font-medium">{team.losses}</div>
              <div className="col-span-1 text-center text-foreground font-medium">{team.goalDifference}</div>
              <div className="col-span-2 text-center font-semibold text-foreground">{team.points}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default GroupTable;