import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useTournament } from '@/hooks/useTournament';
import GroupTable from '@/components/GroupTable';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PublicTournamentView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const { groups, knockoutMatches } = useTournament(tournamentId || '', numberOfGroups);

  useEffect(() => {
    if (!tournamentId || !db) return;

    const unsubscribe = onSnapshot(doc(db, 'tournaments', tournamentId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTournamentName(data.name);
        setNumberOfGroups(data.numberOfGroups);
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  const qualifiedTeams = groups.flatMap(group => {
    const sortedTeams = [...group.teams].sort((a, b) => 
      b.points - a.points || b.goalDifference - a.goalDifference
    );
    return sortedTeams.slice(0, 2).map(team => team.id);
  });

  const hasKnockoutMatches = knockoutMatches.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournaments
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">{tournamentName || 'Loading...'}</h1>
            <p className="text-muted-foreground">Live tournament standings and results</p>
          </div>
        </header>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="groups">Group Stage</TabsTrigger>
            <TabsTrigger value="knockout" disabled={!hasKnockoutMatches}>
              Knockout Stage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-6">
            <div className="mb-6 p-4 bg-card rounded-xl border border-border">
              <h3 className="text-lg font-semibold mb-3 text-center">Qualification Status</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-qualified-first rounded"></div>
                  <span className="text-sm font-medium">Top 2 from each group advance</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {groups.slice(0, numberOfGroups).map((group) => (
                <GroupTable 
                  key={group.id} 
                  group={group} 
                  qualifiedTeams={{ firstPlace: qualifiedTeams, secondPlace: [] }} 
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="knockout" className="mt-6">
            {hasKnockoutMatches ? (
              <KnockoutBracket matches={knockoutMatches} onUpdateScore={() => {}} readOnly />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Knockout stage not started yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
