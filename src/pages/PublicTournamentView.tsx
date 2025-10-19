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
import { ArrowLeft, Trophy, Loader2, Swords } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// (Assuming TournamentDoc is defined elsewhere for type safety)
interface TournamentDoc {
    name: string;
    numberOfGroups: number;
}

// 🟢 Loading Component for Initial Fetch
const TournamentLoadingSkeleton = () => (
    <div className="flex flex-col items-center justify-center p-12 h-[60vh] bg-card rounded-xl shadow-lg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-semibold text-muted-foreground">
            Loading Tournament Data...
        </div>
        <div className="h-6 w-4/5 bg-muted rounded-md mt-8 animate-pulse"></div>
        <div className="h-4 w-3/5 bg-muted rounded-md mt-2 animate-pulse"></div>
    </div>
);

export const PublicTournamentView = () => {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const navigate = useNavigate();
    const [tournamentName, setTournamentName] = useState('');
    const [numberOfGroups, setNumberOfGroups] = useState(4);
    
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    // useTournament hook already handles data fetching and potentially its own loading state
    const { groups, matches, fixtures, knockoutMatches, isLoading: isLoadingTournamentData } = useTournament(tournamentId || '', numberOfGroups);

    const isTotalLoading = isLoadingDetails || isLoadingTournamentData;

    useEffect(() => {
        if (!tournamentId || !db) return;
        
        setIsLoadingDetails(true);

        const unsubscribe = onSnapshot(doc(db, 'tournaments', tournamentId), (docSnap) => {
            if (docSnap.exists()) {
                // ✅ Added type assertion for better safety
                const data = docSnap.data() as TournamentDoc; 
                setTournamentName(data.name || 'Tournament Not Found');
                setNumberOfGroups(data.numberOfGroups || 4); // Added fallback
            } else {
                setTournamentName('Tournament Not Found');
            }
            setIsLoadingDetails(false);
        });

        return () => unsubscribe();
    }, [tournamentId]);

    // ❌ REMOVED: The global qualifiedTeams calculation is not needed here
    /* const qualifiedTeams = groups.flatMap(group => {
        const sortedTeams = [...group.teams].sort((a, b) => 
            b.points - a.points || b.goalDifference - a.goalDifference
        );
        return sortedTeams.slice(0, 2).map(team => team.id);
    });
    */

    const hasKnockoutMatches = knockoutMatches.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/10 to-primary/5 relative">
            
            {/* Header remains unchanged */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-md p-4 flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                    <Swords className="w-5 h-5 text-primary" />
                    <h1 className="text-xl sm:text-2xl font-extrabold">
                        <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Easy</span>
                        <span className="bg-gradient-to-l from-primary to-purple-400 bg-clip-text text-transparent">League</span>
                    </h1>
                </div>
                <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="hidden sm:flex">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tournaments
                </Button>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 mt-16 pb-20">

                {isTotalLoading ? (
                    <TournamentLoadingSkeleton />
                ) : (
                    <>
                        {/* Tournament Title Block remains unchanged */}
                        <div className="text-center py-6 sm:py-8 mb-4">
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
                                {tournamentName}
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                                Live standings, fixtures, and match results for this competition.
                            </p>
                        </div>

                        <Tabs defaultValue="groups" className="w-full">
                            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 h-auto">
                                <TabsTrigger value="groups" className="text-sm sm:text-base">Groups</TabsTrigger>
                                <TabsTrigger value="fixtures" className="text-sm sm:text-base">Fixtures</TabsTrigger>
                                <TabsTrigger value="matches" className="text-sm sm:text-base">Matches</TabsTrigger>
                                <TabsTrigger value="knockout" disabled={!hasKnockoutMatches} className="text-sm sm:text-base">
                                    Knockout
                                </TabsTrigger>
                            </TabsList>

                            {/* Groups Content */}
                            <TabsContent value="groups" className="mt-6">
                                <div className="mb-6 p-4 bg-card rounded-xl border border-border shadow-md">
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">Qualification Status</h3>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-qualified-first rounded-sm"></div> 
                                            <span className="text-sm font-medium text-muted-foreground">Top 2 from each group advance</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {groups.slice(0, numberOfGroups).map((group) => {
                                        // ✅ CORRECTED LOGIC: Calculate qualifiers FOR THIS GROUP
                                        const sortedTeams = [...group.teams].sort((a, b) => 
                                            b.points - a.points || b.goalDifference - a.goalDifference
                                        );
                                        
                                        const firstPlaceTeamId = sortedTeams[0]?.id ? [sortedTeams[0].id] : [];
                                        const secondPlaceTeamId = sortedTeams[1]?.id ? [sortedTeams[1].id] : [];

                                        return (
                                            <GroupTable 
                                                key={group.id} 
                                                group={group} 
                                                // ✅ CORRECTED: Pass the specific 1st and 2nd place teams for the current group
                                                qualifiedTeams={{ 
                                                    firstPlace: firstPlaceTeamId, 
                                                    secondPlace: secondPlaceTeamId 
                                                }} 
                                            />
                                        );
                                    })}
                                </div>
                            </TabsContent>

                            {/* Other Tabs Content remains unchanged */}
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
                                    <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                                        <p className="text-muted-foreground">Knockout stage not started yet</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </main>

            {/* Footer remains unchanged */}
           <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 text-center py-4 text-xs sm:text-sm text-muted-foreground shadow-lg">
        <p>© {new Date().getFullYear()} EasyLeague. May the best team win</p>
        
      </footer>
        </div>
    );
};