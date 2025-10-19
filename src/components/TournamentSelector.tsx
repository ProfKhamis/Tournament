import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Swords } from 'lucide-react'; 

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

export const TournamentSelector = ({
  onSelectTournament,
}: TournamentSelectorProps) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState<number>(4);
  const [isCreating, setIsCreating] = useState(false); 

  // 🔹 Listen to tournaments created by the logged-in user
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'tournaments'),
      where('createdBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentsData: Tournament[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Tournament',
          numberOfGroups: Number(data.numberOfGroups) || 0,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
        };
      });
      setTournaments(tournamentsData);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 🔹 Create a new tournament
  const handleCreateTournament = async () => {
    if (!tournamentName.trim() || !user?.uid) {
      toast.error('Please enter a tournament name.');
      return;
    }
    
    if (isCreating) return; 

    setIsCreating(true); 

    try {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        name: tournamentName.trim(),
        numberOfGroups,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      toast.success('Tournament created successfully!');
      setShowCreate(false);
      setTournamentName('');

      onSelectTournament(docRef.id, numberOfGroups);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament.');
    } finally {
      setIsCreating(false); 
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-gradient-to-br from-background to-accent/20 relative">
      
      {/* =================================
        1. CATCHY TOP LOGO (Header)
        =================================
      */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <Swords className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Easy</span>
                <span className="bg-gradient-to-l from-primary to-purple-400 bg-clip-text text-transparent">League</span>
            </h1>
        </div>
        {/* Placeholder for any optional nav buttons */}
      </header>

      {/* =================================
        2. MAIN CONTENT (Centered Card)
        =================================
      */}
      {/* pt-20 pushes the content below the fixed header (p-4 + h-5) */}
      <main className="flex-grow flex items-center justify-center p-4 pt-20 pb-20"> 
        <Card className="w-full max-w-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/20">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">
                Select or Create Tournament
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showCreate ? (
              <>
                {tournaments.length > 0 ? (
                  <div className="grid gap-2">
                    {tournaments.map((tournament) => (
                      <Button
                        key={tournament.id}
                        variant="outline"
                        className="w-full justify-between h-auto py-3 transition-colors hover:bg-primary/10"
                        onClick={() =>
                          onSelectTournament(
                            tournament.id,
                            tournament.numberOfGroups
                          )
                        }
                      >
                        <span className="font-medium text-base text-left truncate">{tournament.name}</span>
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {tournament.numberOfGroups} groups
                        </span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm sm:text-base p-4 border rounded-lg border-dashed">
                    No tournaments found. Start your first competition!
                  </p>
                )}

                <Button onClick={() => setShowCreate(true)} className="w-full shadow-lg hover:shadow-primary/30">
                  Create New Tournament
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Tournament Name"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  disabled={isCreating} 
                />

                <Select
                  value={numberOfGroups.toString()}
                  onValueChange={(val) => setNumberOfGroups(parseInt(val))}
                  disabled={isCreating} 
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Number of Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Groups</SelectItem>
                    <SelectItem value="3">3 Groups</SelectItem>
                    <SelectItem value="4">4 Groups</SelectItem>
                    <SelectItem value="5">5 Groups</SelectItem>
                    <SelectItem value="6">6 Groups</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateTournament}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                    className="flex-1"
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* =================================
        3. CATCHY FIXED FOOTER
        =================================
      */}
     <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 text-center py-4 text-xs sm:text-sm text-muted-foreground shadow-lg">
        <p>© {new Date().getFullYear()} EasyLeague. May the best team win</p>
        
      </footer>
    </div>
  );
};