import { Group } from '@/types/tournament';

interface GroupTableProps {
  group: Group;
}

const GroupTable = ({ group }: GroupTableProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <h2 className="text-xl font-semibold text-tournament-header mb-6 text-center">
        {group.name}
      </h2>
      
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 text-sm font-medium text-tournament-table-header pb-2">
          <div className="col-span-2">TEAM</div>
          <div className="text-center">W</div>
          <div className="text-center">D</div>
          <div className="text-center">L</div>
          <div className="text-center">GD</div>
          <div className="text-center">PTS</div>
        </div>
        
        {/* Teams */}
        {group.teams
          .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
          .map((team) => (
            <div key={team.id} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-border/30 last:border-0">
              <div className="col-span-2 font-medium text-foreground truncate">
                {team.name}
              </div>
              <div className="text-center text-muted-foreground">{team.wins}</div>
              <div className="text-center text-muted-foreground">{team.draws}</div>
              <div className="text-center text-muted-foreground">{team.losses}</div>
              <div className="text-center text-muted-foreground">{team.goalDifference}</div>
              <div className="text-center font-medium text-foreground">{team.points}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default GroupTable;