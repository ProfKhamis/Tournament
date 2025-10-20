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
import { ArrowLeft, Trophy, Loader2, Swords } from 'lucide-react'; // Added Swords and Loader2
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    
    // 🟢 State to manage the initial loading of tournament details
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    // useTournament hook already handles data fetching
    const { groups, matches, fixtures, knockoutMatches } = useTournament(tournamentId || '', numberOfGroups);

    // 🟢 COMBINED LOADING STATE
    const isTotalLoading = isLoadingDetails;

    useEffect(() => {
        if (!tournamentId || !db) return;
        
        setIsLoadingDetails(true); // Start loading

        const unsubscribe = onSnapshot(doc(db, 'tournaments', tournamentId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTournamentName(data.name);
                setNumberOfGroups(data.numberOfGroups);
            } else {
                // Optional: navigate to 404 or error page if tournament not found
                setTournamentName('Tournament Not Found');
            }
            setIsLoadingDetails(false); // End loading regardless of success/fail
        });

        return () => unsubscribe();
    }, [tournamentId]);

    const qualifiedTeams = groups.flatMap(group => {
        const sortedTeams = [...group.teams].sort((a, b) => 
            b.points - a.points || b.goalDifference - a.goalDifference
        );
        // Assuming top 2 qualify
        return sortedTeams.slice(0, 2).map(team => team.id);
    });

    const hasKnockoutMatches = knockoutMatches.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/10 to-primary/5 relative">
            
            {/* =================================
              1. CATCHY TOP LOGO (Fixed Header)
              =================================
            */}
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

            {/* =================================
              2. MAIN CONTENT AREA
              =================================
            */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 mt-16 pb-20"> {/* pt-16 for header, pb-20 for footer */}

                {isTotalLoading ? (
                    <TournamentLoadingSkeleton />
                ) : (
                    <>
                        {/* Tournament Title Block */}
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

                        {/* Tabs Navigation (Responsive) */}
                        <Tabs defaultValue="groups" className="w-full">
                            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 h-auto">
                                <TabsTrigger value="groups" className="text-sm sm:text-base">Groups</TabsTrigger>
                                <TabsTrigger value="fixtures" className="text-sm sm:text-base">Fixtures</TabsTrigger>
                                <TabsTrigger value="matches" className="text-sm sm:text-base">Matches</TabsTrigger>
                                <TabsTrigger value="knockout" disabled={!hasKnockoutMatches} className="text-sm sm:text-base">
                                    Knockout
                                </TabsTrigger>
                            </TabsList>

                            {/* Groups Content (Responsive Grid) */}
                            <TabsContent value="groups" className="mt-6">
                                <div className="mb-6 p-4 bg-card rounded-xl border border-border shadow-md">
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">Qualification Status</h3>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-primary rounded-sm"></div> {/* Using primary color for qualification indicator */}
                                            <span className="text-sm font-medium text-muted-foreground">Top 2 from each group advance</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {groups.slice(0, numberOfGroups).map((group) => (
                                        <GroupTable 
                                            key={group.id} 
                                            group={group} 
                                            // Passing qualified teams for visual highlighting
                                            qualifiedTeams={{ firstPlace: qualifiedTeams, secondPlace: [] }} 
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Fixtures, Matches, Knockout (Responsive containers) */}
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

            {/* =================================
              3. CATCHY FIXED FOOTER
              =================================
            */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-4 border-primary/50 text-center py-3 text-xs sm:text-sm text-muted-foreground shadow-inner shadow-primary/10">
                <p>
                    Powered by <span className="font-semibold text-primary">EasyLeague</span>. May the best team win 🏆
                </p>
            </footer>
        </div>
    );
};