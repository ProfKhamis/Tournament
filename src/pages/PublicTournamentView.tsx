import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useTournament } from '@/hooks/useTournament';
import GroupTable from '@/components/GroupTable';
import { KnockoutBracket } from '@/components/KnockoutBracket';
import { PublicFixturesView } from '@/components/PublicFixturesView';
import { PublicMatchHistory } from '@/components/PublicMatchHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PublicTournamentView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournamentName, setTournamentName] = useState('');
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const { groups, matches, fixtures, knockoutMatches } = useTournament(tournamentId || '', numberOfGroups);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournaments
          </Button>
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">{tournamentName || 'Loading...'}</h1>
            <p className="text-muted-foreground">Live standings, fixtures, and match results</p>
          </div>
        </header>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="knockout" disabled={!hasKnockoutMatches}>
              Knockout
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

          <TabsContent value="fixtures" className="mt-6">
            <PublicFixturesView groups={groups.slice(0, numberOfGroups)} fixtures={fixtures} />
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <PublicMatchHistory groups={groups.slice(0, numberOfGroups)} matches={matches} />
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
