import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Tournament {
  id: string;
  name: string;
  numberOfGroups: number;
  createdBy: string;
  createdAt: any;
}

interface TournamentSelectorProps {
  onSelectTournament: (tournamentId: string, numberOfGroups: number) => void;
}

export const TournamentSelector = ({ onSelectTournament }: TournamentSelectorProps) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState('4');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tournaments'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tournament));
      setTournaments(tournamentsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTournament = async () => {
    if (!tournamentName.trim() || !user) return;

    try {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        name: tournamentName,
        numberOfGroups: parseInt(numberOfGroups),
        createdBy: user.uid,
        createdAt: Timestamp.now()
      });
      
      toast.success('Tournament created successfully');
      setShowCreate(false);
      setTournamentName('');
      onSelectTournament(docRef.id, parseInt(numberOfGroups));
    } catch (error) {
      toast.error('Failed to create tournament');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Your Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreate ? (
            <>
              <div className="grid gap-2">
                {tournaments.map(tournament => (
                  <Button
                    key={tournament.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => onSelectTournament(tournament.id, tournament.numberOfGroups)}
                  >
                    <span>{tournament.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.numberOfGroups} groups
                    </span>
                  </Button>
                ))}
              </div>
              <Button onClick={() => setShowCreate(true)} className="w-full">
                Create New Tournament
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Tournament Name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
              <Select value={numberOfGroups} onValueChange={setNumberOfGroups}>
                <SelectTrigger>
                  <SelectValue placeholder="Number of Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Groups</SelectItem>
                  <SelectItem value="3">3 Groups</SelectItem>
                  <SelectItem value="4">4 Groups</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleCreateTournament} className="flex-1">
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
