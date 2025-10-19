import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, Timestamp, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
  const { isAdmin } = useAdmin();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState('4');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);

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

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;

    try {
      // Delete all subcollections
      const collections = ['groups', 'matches', 'fixtures', 'knockout'];
      
      for (const collectionName of collections) {
        const subCollectionRef = collection(db, 'tournaments', tournamentToDelete.id, collectionName);
        const snapshot = await getDocs(subCollectionRef);
        
        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, 'tournaments', tournamentToDelete.id, collectionName, document.id));
        }
      }

      // Delete the tournament document
      await deleteDoc(doc(db, 'tournaments', tournamentToDelete.id));
      
      toast.success('Tournament deleted successfully');
      setDeleteDialogOpen(false);
      setTournamentToDelete(null);
    } catch (error) {
      toast.error('Failed to delete tournament');
      console.error(error);
    }
  };

  const confirmDelete = (tournament: Tournament, e: React.MouseEvent) => {
    e.stopPropagation();
    setTournamentToDelete(tournament);
    setDeleteDialogOpen(true);
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
                  <div key={tournament.id} className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 justify-between"
                      onClick={() => onSelectTournament(tournament.id, tournament.numberOfGroups)}
                    >
                      <span>{tournament.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {tournament.numberOfGroups} groups
                      </span>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => confirmDelete(tournament, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tournamentToDelete?.name}"? This will permanently delete all teams, matches, fixtures, and knockout data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTournamentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTournament} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
