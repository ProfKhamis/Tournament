import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Trophy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Team, Group } from '@/types/tournament';

interface AdminPanelProps {
  groups: Group[];
  onAddTeam: (groupId: string, teamName: string) => boolean;
  onRemoveTeam: (groupId: string, teamId: string) => void;
  onEditTeam: (groupId: string, teamId: string, newName: string) => void;
  onSubmitScore: (
    homeTeamId: string,
    awayTeamId: string,
    homeScore: number,
    awayScore: number,
    groupId: string
  ) => void;
}

interface ScoreEntry {
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: string;
  awayScore: string;
}

interface EditingTeam {
  groupId: string;
  teamId: string;
  name: string;
}

const EditTeamDialog = ({
  editingTeam,
  onSave,
  onClose,
}: {
  editingTeam: EditingTeam;
  onSave: (team: EditingTeam) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(editingTeam.name);
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    onSave({ ...editingTeam, name: name.trim() });
    onClose();
    toast({ title: 'Success', description: 'Team name updated successfully' });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-xl p-4">
        <DialogHeader>
          <DialogTitle>Edit Team Name</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Team Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminPanel = ({
  groups,
  onAddTeam,
  onRemoveTeam,
  onEditTeam,
  onSubmitScore,
}: AdminPanelProps) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [editingTeam, setEditingTeam] = useState<EditingTeam | null>(null);
  const [scoreEntry, setScoreEntry] = useState<ScoreEntry>({
    groupId: '',
    homeTeamId: '',
    awayTeamId: '',
    homeScore: '',
    awayScore: '',
  });
  const { toast } = useToast();

  const handleAddTeam = () => {
    if (!newTeamName.trim() || !selectedGroup) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const existing = groups
      .find((g) => g.id === selectedGroup)
      ?.teams?.some(
        (t) =>
          t.name.toLowerCase() === newTeamName.trim().toLowerCase()
      );

    if (existing) {
      toast({
        title: 'Error',
        description: 'Team already exists in this group',
        variant: 'destructive',
      });
      return;
    }

    const success = onAddTeam(selectedGroup, newTeamName.trim());
    if (success) {
      setNewTeamName('');
      setSelectedGroup('');
      toast({ title: 'Success', description: 'Team added successfully' });
    }
  };

  const handleEditTeam = (team: EditingTeam) => {
    onEditTeam(team.groupId, team.teamId, team.name);
    setEditingTeam(null);
  };

  const handleSubmitScore = () => {
    const { groupId, homeTeamId, awayTeamId, homeScore, awayScore } =
      scoreEntry;

    if (!groupId || !homeTeamId || !awayTeamId || homeScore === '' || awayScore === '') {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast({
        title: 'Error',
        description: 'Home and away teams must be different',
        variant: 'destructive',
      });
      return;
    }

    const home = Number(homeScore);
    const away = Number(awayScore);
    if (isNaN(home) || isNaN(away)) {
      toast({
        title: 'Error',
        description: 'Scores must be numbers',
        variant: 'destructive',
      });
      return;
    }

    onSubmitScore(homeTeamId, awayTeamId, home, away, groupId);
    setScoreEntry({
      groupId: '',
      homeTeamId: '',
      awayTeamId: '',
      homeScore: '',
      awayScore: '',
    });
    toast({ title: 'Success', description: 'Score submitted successfully' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed top-4 right-4 z-50 p-2 sm:p-4 h-10"
          size="sm"
        >
          <Trophy className="w-4 h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Admin Panel</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Tournament Admin Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-2 overflow-x-auto">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* === Teams Tab === */}
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5" /> Add New Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="group-select">Group</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleAddTeam} className="flex-1">
                    Add Team
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewTeamName('');
                      setSelectedGroup('');
                    }}
                    className="flex-1"
                  >
                    Clear Fields
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Teams</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-3">{group.name}</h4>
                    {(group.teams || []).length > 0 ? (
                      group.teams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-2 bg-muted rounded mb-2"
                        >
                          <span className="truncate">{team.name}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                setEditingTeam({
                                  groupId: group.id,
                                  teamId: team.id,
                                  name: team.name,
                                })
                              }
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Remove ${team.name}?`))
                                  onRemoveTeam(group.id, team.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No teams yet
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Scores Tab === */}
          <TabsContent value="scores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit Match Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Group</Label>
                <Select
                  value={scoreEntry.groupId}
                  onValueChange={(value) =>
                    setScoreEntry({
                      ...scoreEntry,
                      groupId: value,
                      homeTeamId: '',
                      awayTeamId: '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {scoreEntry.groupId && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <Label>Home Team</Label>
                        <Select
                          value={scoreEntry.homeTeamId}
                          onValueChange={(v) =>
                            setScoreEntry({ ...scoreEntry, homeTeamId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select home team" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {(groups.find((g) => g.id === scoreEntry.groupId)
                              ?.teams || []
                            ).map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Away Team</Label>
                        <Select
                          value={scoreEntry.awayTeamId}
                          onValueChange={(v) =>
                            setScoreEntry({ ...scoreEntry, awayTeamId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select away team" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {(groups.find((g) => g.id === scoreEntry.groupId)
                              ?.teams || []
                            ).map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <Label>Home Score</Label>
                        <Input
                          type="number"
                          min={0}
                          value={scoreEntry.homeScore}
                          onChange={(e) =>
                            setScoreEntry({
                              ...scoreEntry,
                              homeScore: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Away Score</Label>
                        <Input
                          type="number"
                          min={0}
                          value={scoreEntry.awayScore}
                          onChange={(e) =>
                            setScoreEntry({
                              ...scoreEntry,
                              awayScore: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitScore}
                      className="w-full mt-4"
                    >
                      Submit Score
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Overview Tab === */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tournament Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 border rounded-lg bg-muted/30"
                    >
                      <h4 className="font-semibold mb-2">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(group.teams || []).length} teams
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editingTeam && (
          <EditTeamDialog
            editingTeam={editingTeam}
            onSave={handleEditTeam}
            onClose={() => setEditingTeam(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
