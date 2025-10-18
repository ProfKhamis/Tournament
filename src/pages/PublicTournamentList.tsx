import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  numberOfGroups: number;
  createdBy: string;
  createdAt: any;
}

export const PublicTournamentList = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(collection(db, 'tournaments'), (snapshot) => {
      const tournamentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tournament));
      setTournaments(tournamentsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Browse Tournaments</h1>
            <p className="text-muted-foreground">View live tournament standings and results</p>
          </div>
          <Button onClick={() => navigate('/admin')} variant="default">
            <LogIn className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Available Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {tournaments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tournaments available yet</p>
              ) : (
                tournaments.map(tournament => (
                  <Button
                    key={tournament.id}
                    variant="outline"
                    className="w-full justify-between h-auto py-4"
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                  >
                    <span className="text-lg font-semibold">{tournament.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.numberOfGroups} groups
                    </span>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
