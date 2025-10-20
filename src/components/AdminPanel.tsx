import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Team, Group } from '@/types/tournament';
import { Plus, Trash2, Edit2, Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  groups: Group[];
  onAddTeam: (groupId: string, teamName: string) => void;
  onRemoveTeam: (groupId: string, teamId: string) => void;
  onEditTeam: (groupId: string, teamId: string, newName: string) => void;
  onSubmitScore: (homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, groupId: string) => void;
}

const AdminPanel = ({ groups, onAddTeam, onRemoveTeam, onEditTeam, onSubmitScore }: AdminPanelProps) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [editingTeam, setEditingTeam] = useState<{ groupId: string; teamId: string; name: string } | null>(null);
  const [scoreEntry, setScoreEntry] = useState({
    groupId: '',
    homeTeamId: '',
    awayTeamId: '',
    homeScore: '',
    awayScore: ''
  });
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const { toast } = useToast();

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !selectedGroup) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsAddingTeam(true);
    try {
      await onAddTeam(selectedGroup, newTeamName);
      setNewTeamName('');
      setSelectedGroup('');
    } finally {
      setIsAddingTeam(false);
    }
  };

  const handleEditTeam = () => {
    if (!editingTeam || !editingTeam.name.trim()) {
      toast({ title: "Error", description: "Please enter a valid team name", variant: "destructive" });
      return;
    }
    onEditTeam(editingTeam.groupId, editingTeam.teamId, editingTeam.name);
    setEditingTeam(null);
  };

  const handleSubmitScore = () => {
    const { groupId, homeTeamId, awayTeamId, homeScore, awayScore } = scoreEntry;
    
    if (!groupId || !homeTeamId || !awayTeamId || homeScore === '' || awayScore === '') {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    if (homeTeamId === awayTeamId) {
      toast({ title: "Error", description: "Please select different teams", variant: "destructive" });
      return;
    }

    onSubmitScore(homeTeamId, awayTeamId, parseInt(homeScore), parseInt(awayScore), groupId);
    setScoreEntry({ groupId: '', homeTeamId: '', awayTeamId: '', homeScore: '', awayScore: '' });
    toast({ title: "Success", description: "Score submitted successfully" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* The fixed positioning is good for mobile accessibility */}
        <Button variant="outline" className="fixed top-4 right-4 z-50">
          <Trophy className="w-4 h-4 mr-2" />
          Admin Panel
        </Button>
      </DialogTrigger>
      {/* Ensure the dialog content is responsive on small screens */}
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95%] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Tournament Admin Panel</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="teams" className="w-full">
          {/* TabsList remains excellent for mobile full-width navigation */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teams">Manage Teams</TabsTrigger>
            <TabsTrigger value="scores">Submit Scores</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams" className="space-y-6">
            {/* Add Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ⭐ RESPONSIVENESS FIX: grid-cols-1 on mobile, grid-cols-2 on medium screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-select">Group</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddTeam} className="w-full" disabled={isAddingTeam}>
                  {isAddingTeam ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Team...
                    </>
                  ) : (
                    'Add Team'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card>
              <CardHeader>
                <CardTitle>Current Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{group.name}</h4>
                      <div className="space-y-2">
                        {group.teams.map((team) => (
                          <div key={team.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            {/* Allow team names to wrap on small screens */}
                            <span className="truncate mr-2">{team.name}</span> 
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTeam({ groupId: group.id, teamId: team.id, name: team.name })}
                                // Added `aria-label` for better accessibility
                                aria-label={`Edit ${team.name}`} 
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onRemoveTeam(group.id, team.id)}
                                aria-label={`Remove ${team.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit Match Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Group</Label>
                  <Select
                    value={scoreEntry.groupId}
                    onValueChange={(value) => setScoreEntry({ ...scoreEntry, groupId: value, homeTeamId: '', awayTeamId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {scoreEntry.groupId && (
                  <>
                    {/* ⭐ RESPONSIVENESS FIX: grid-cols-1 on mobile, grid-cols-2 on medium screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                      <div>
                        <Label>Home Team</Label>
                        <Select
                          value={scoreEntry.homeTeamId}
                          onValueChange={(value) => setScoreEntry({ ...scoreEntry, homeTeamId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select home team" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.find(g => g.id === scoreEntry.groupId)?.teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Away Team</Label>
                        <Select
                          value={scoreEntry.awayTeamId}
                          onValueChange={(value) => setScoreEntry({ ...scoreEntry, awayTeamId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select away team" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.find(g => g.id === scoreEntry.groupId)?.teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ⭐ RESPONSIVENESS FIX: grid-cols-1 on mobile, grid-cols-2 on medium screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                      <div>
                        <Label>Home Score</Label>
                        <Input
                          type="number"
                          min="0"
                          value={scoreEntry.homeScore}
                          onChange={(e) => setScoreEntry({ ...scoreEntry, homeScore: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Away Score</Label>
                        <Input
                          type="number"
                          min="0"
                          value={scoreEntry.awayScore}
                          onChange={(e) => setScoreEntry({ ...scoreEntry, awayScore: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSubmitScore} className="w-full">
                      Submit Score
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* The original grid was responsive, but made explicit for clarity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> 
                  {groups.map((group) => (
                    <div key={group.id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.teams.length} teams
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Team Dialog - already responsive */}
        {editingTeam && (
          <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team Name</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Team Name</Label>
                  <Input
                    id="edit-name"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button onClick={handleEditTeam} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTeam(null)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;