import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Trophy, Swords, Crown, LogIn, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 overflow-x-hidden">

      {/* ======== BACKGROUND FIXED ======== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      {/* ======== MAIN CONTENT ======== */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-10">
        
        {/* HEADER / NAVBAR */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/50 h-16 flex items-center px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Easy</span>
            <span className="bg-gradient-to-l from-primary to-purple-400 bg-clip-text text-transparent">League</span>
          </h1>

          <Button 
            onClick={() => navigate('/admin')} 
            size="sm" 
            className="hover-scale shadow-lg ml-auto"
          >
            <Crown className="w-3 h-3 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Admin Portal</span>
            <span className="inline sm:hidden">Admin</span>
            <LogIn className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {/* HERO HEADER */}
        <header className="text-center mb-10 pt-20 sm:pt-24 animate-fade-in"> 
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-3 sm:mb-4">
            Tournament Arena
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Watch epic battles unfold. Track your favorite teams. Witness champions rise.
          </p>
        </header>

        {/* TOURNAMENT GRID */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Swords className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold sm:text-2xl">Active Tournaments</h2>
          </div>

          {tournaments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 sm:py-16">
                <div className="text-center">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-base sm:text-lg mb-2">No tournaments yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Check back soon for epic battles!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournaments.map((tournament, index) => (
                <Card 
                  key={tournament.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 overflow-hidden animate-fade-in hover-scale relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                >
                  {/* Overlay — now doesn't block clicks */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  <CardHeader className="relative p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:scale-110 transition-transform" />
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Live
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors sm:text-xl">
                      {tournament.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative p-4 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{tournament.numberOfGroups} Groups</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Active</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground text-sm"
                      variant="outline"
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/tournament/${tournament.id}`);
                      }}
                    >
                      View Tournament
                      <Swords className="w-3 h-3 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="pb-20"></div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 text-center py-4 text-xs sm:text-sm text-muted-foreground shadow-lg">
        <p>© {new Date().getFullYear()} EasyLeague. May the best team win</p>
        
      </footer>
    </div>
  );
};
