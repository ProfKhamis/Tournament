import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Trophy, Swords, Crown, LogIn, Users, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto p-6 relative z-10">
        {/* Hero Header */}
        <header className="text-center mb-12 pt-8 animate-fade-in">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Trophy className="w-16 h-16 text-primary animate-scale-in" />
            <Swords className="w-12 h-12 text-primary/70" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            Tournament Arena
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Watch epic battles unfold. Track your favorite teams. Witness champions rise.
          </p>
          <Button 
            onClick={() => navigate('/admin')} 
            size="lg"
            className="hover-scale shadow-lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Admin Portal
            <LogIn className="w-4 h-4 ml-2" />
          </Button>
        </header>

        {/* Tournament Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Swords className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Active Tournaments</h2>
          </div>

          {tournaments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16">
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">No tournaments yet</p>
                  <p className="text-sm text-muted-foreground">Check back soon for epic battles!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament, index) => (
                <Card 
                  key={tournament.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 overflow-hidden animate-fade-in hover-scale"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <Trophy className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Live
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">
                      {tournament.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{tournament.numberOfGroups} Groups</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground"
                      variant="outline"
                    >
                      View Tournament
                      <Swords className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground">
          <p>May the best team win 🏆</p>
        </footer>
      </div>
    </div>
  );
};

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
};
