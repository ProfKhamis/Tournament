import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  updateDoc,
  getDoc, // getDoc is used in getGroupDoc
  arrayRemove, // arrayRemove is correct for object removal if the exact object is known
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Group, Team, Match, Fixture, KnockoutMatch } from '@/types/tournament';
import { createInitialGroups } from '@/data/initialTournamentData';
import { toast } from 'sonner'; // Using sonner for toast notifications

export const useTournament = (
  tournamentId: string | null,
  numberOfGroups: number
) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Loading Effect ---
  useEffect(() => {
    if (!tournamentId || tournamentId === 'default') {
      setIsLoading(false);
      setGroups([]);
      setMatches([]);
      setFixtures([]);
      setKnockoutMatches([]);
      return;
    }

    setIsLoading(true);
    // Clear state on new tournamentId to prevent flash of old data
    setGroups([]);
    setMatches([]);
    setFixtures([]);
    setKnockoutMatches([]);

    const refs = {
      groups: collection(db, 'tournaments', tournamentId, 'groups'),
      matches: collection(db, 'tournaments', tournamentId, 'matches'),
      fixtures: collection(db, 'tournaments', tournamentId, 'fixtures'),
      knockout: collection(db, 'tournaments', tournamentId, 'knockout'),
    };

    const loaded = { groups: false, matches: false, fixtures: false, knockout: false };
    const markLoaded = (key: keyof typeof loaded) => {
      if (!loaded[key]) {
        loaded[key] = true;
        if (Object.values(loaded).every(Boolean)) setIsLoading(false);
      }
    };

    // --- GROUPS Listener ---
    const unsubGroups = onSnapshot(
      refs.groups,
      async (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Group[];

        if (data.length === 0 && numberOfGroups > 0) {
          console.log('No groups found. Creating initial groups in Firestore...');
          const initialGroups = createInitialGroups(numberOfGroups);
          const batch = writeBatch(db);
          initialGroups.forEach((group) => {
            batch.set(doc(refs.groups, group.id), group);
          });
          await batch.commit();
          // The listener will fire again with the new data, so we don't set state here
          return;
        }

        setGroups(data.sort((a, b) => a.name.localeCompare(b.name)));
        markLoaded('groups');
      },
      (error) => {
        console.error('❌ Groups listener error:', error);
        toast.error('Failed to load groups');
        markLoaded('groups');
      }
    );

    // --- MATCHES Listener ---
    const unsubMatches = onSnapshot(
      refs.matches,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Match[];
        setMatches(data);
        markLoaded('matches');
      },
      (error) => {
        console.error('❌ Matches listener error:', error);
        markLoaded('matches');
      }
    );

    // --- FIXTURES Listener ---
    const unsubFixtures = onSnapshot(
      refs.fixtures,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Fixture, 'id'>),
        }));
        setFixtures(data);
        markLoaded('fixtures');
      },
      (error) => {
        console.error('❌ Fixtures listener error:', error);
        markLoaded('fixtures');
      }
    );

    // --- KNOCKOUT Listener ---
    const unsubKnockout = onSnapshot(
      refs.knockout,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<KnockoutMatch, 'id'>),
        }));
        setKnockoutMatches(data);
        markLoaded('knockout');
      },
      (error) => {
        console.error('❌ Knockout listener error:', error);
        markLoaded('knockout');
      }
    );

    return () => {
      unsubGroups();
      unsubMatches();
      unsubFixtures();
      unsubKnockout();
    };
  }, [tournamentId, numberOfGroups]);

  // --- Helper to get a group doc (used by edit/score functions) ---
  const getGroupDoc = async (groupId: string) => {
    if (!tournamentId) throw new Error('No tournament ID');
    const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId);
    // Use getDoc here to get the current state for a transaction/update
    const groupSnap = await getDoc(groupRef); 
    if (!groupSnap.exists()) throw new Error('Group not found');
    return { ref: groupRef, data: groupSnap.data() as Group };
  };

  // --- CORRECTED GRANULAR FUNCTIONS ---

 const addTeam = async (groupId: string, teamName: string): Promise<boolean> => {
    if (!tournamentId) return false;

    // Check for duplicates locally first for a faster UI response
    const group = groups.find((g) => g.id === groupId);
    if (group?.teams?.some((t) => t.name.toLowerCase() === teamName.toLowerCase())) {
        toast.error('Team already exists in this group');
        return false;
    }

    const newTeam: Team = {
        // Using crypto.randomUUID() is fine for client-side ID generation
        id: crypto.randomUUID(), 
        name: teamName,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        goalDifference: 0,
        played: 0,
    };

    try {
        // 1. Get the current group data (Read)
        const { ref: groupRef, data: groupData } = await getGroupDoc(groupId);
        
        // 2. Create a new teams array by appending the new team (Modify)
        // Ensure to handle the case where groupData.teams might be null/undefined initially
        const updatedTeams = [...(groupData.teams || []), newTeam];

        // 3. Write the entire new array back to the document (Write)
        // This replaces the old array with the new one.
        await updateDoc(groupRef, {
            teams: updatedTeams,
        });
        
        toast.success('Team added successfully');
        return true;
    } catch (error) {
        console.error('Error adding team:', error);
        toast.error('Failed to add team');
        return false;
    }
};

  const removeTeam = async (groupId: string, teamId: string) => {
    if (!tournamentId) return;

    // We must find the full team object to use arrayRemove
    const group = groups.find((g) => g.id === groupId);
    const teamToRemove = group?.teams.find((t) => t.id === teamId);

    if (!teamToRemove) {
      toast.error('Could not find team to remove');
      return;
    }

    try {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', groupId);
      // arrayRemove works safely here because teamToRemove is the exact object retrieved
      await updateDoc(groupRef, {
        teams: arrayRemove(teamToRemove), 
      });
      toast.success('Team removed');
    } catch (error) {
      console.error('Error removing team:', error);
      toast.error('Failed to remove team');
    }
  };

  const editTeam = async (
    groupId: string,
    teamId: string,
    newName: string
  ) => {
    if (!tournamentId) return;

    try {
      // This is a "read-modify-write" operation
      const { ref: groupRef, data: groupData } = await getGroupDoc(groupId);

      const updatedTeams = groupData.teams.map((team) =>
        team.id === teamId ? { ...team, name: newName } : team
      );

      await updateDoc(groupRef, { teams: updatedTeams });
      toast.success('Team name updated');
    } catch (error) {
      console.error('Error editing team:', error);
      toast.error('Failed to update team name');
    }
  };

  const submitScore = async (
    homeTeamId: string,
    awayTeamId: string,
    homeScore: number,
    awayScore: number,
    groupId: string
  ) => {
    if (!tournamentId) return;

    try {
      const batch = writeBatch(db);
      // Use the helper to read the current group data
      const { ref: groupRef, data: groupData } = await getGroupDoc(groupId); 

      // Perform deep copy of the found teams to avoid side effects on groupData.teams
      // before the final batch update
      let homeTeam: Team | undefined = JSON.parse(JSON.stringify(groupData.teams.find((t) => t.id === homeTeamId)));
      let awayTeam: Team | undefined = JSON.parse(JSON.stringify(groupData.teams.find((t) => t.id === awayTeamId)));
      

      if (!homeTeam || !awayTeam) throw new Error('Team not found');

      // --- Update stats ---
      homeTeam.played++;
      awayTeam.played++;
      homeTeam.goalsFor += homeScore;
      awayTeam.goalsFor += awayScore;
      homeTeam.goalsAgainst += awayScore;
      awayTeam.goalsAgainst += homeScore;
      homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
      awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

      if (homeScore > awayScore) {
        homeTeam.wins++;
        homeTeam.points += 3;
        awayTeam.losses++;
      } else if (homeScore < awayScore) {
        awayTeam.wins++;
        awayTeam.points += 3;
        homeTeam.losses++;
      } else {
        homeTeam.draws++;
        awayTeam.draws++;
        homeTeam.points += 1;
        awayTeam.points += 1;
      }

      // Create new teams array with updated objects
      const updatedTeams = groupData.teams.map((t) =>
        t.id === homeTeamId ? homeTeam : t.id === awayTeamId ? awayTeam : t
      );

      // Update the group doc in the batch
      batch.update(groupRef, { teams: updatedTeams });

      // Create a match log document in the batch
      const matchRef = doc(
        collection(db, 'tournaments', tournamentId, 'matches')
      );
      batch.set(matchRef, {
        groupId,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        playedAt: new Date(),
      });

      await batch.commit();
      toast.success('Score submitted and tables updated');
    } catch (e: any) {
      console.error('Error submitting score:', e);
      toast.error('Failed to submit score', { description: e.message });
    }
  };

  // --- Keep Functions Used by Other Components (like FixtureGenerator) ---

  const updateFixtures = async (updatedFixtures: Fixture[]) => {
    if (!tournamentId) return;
    try {
      const batch = writeBatch(db);
      const fixturesRef = collection(db, 'tournaments', tournamentId, 'fixtures');
      updatedFixtures.forEach((fixture) => {
        const docRef = fixture.id
          ? doc(fixturesRef, fixture.id)
          : doc(fixturesRef); // Create new doc if no ID
        batch.set(docRef, { ...fixture, id: docRef.id }, { merge: true });
      });
      await batch.commit();
      toast.success('Fixtures saved');
    } catch (e) {
      console.error('Error saving fixtures:', e);
      toast.error('Failed to save fixtures');
    }
  };

  const updateKnockoutMatches = async (updatedKnockout: KnockoutMatch[]) => {
    if (!tournamentId) return;
    try {
      const batch = writeBatch(db);
      updatedKnockout.forEach((match) => {
        const docRef = doc(
          db,
          'tournaments',
          tournamentId,
          'knockout',
          match.id
        );
        batch.set(docRef, match, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Error updating knockout matches:', e);
    }
  };

  return {
    groups,
    matches,
    fixtures,
    knockoutMatches,
    isLoading,
    // --- Return the new functions ---
    addTeam,
    removeTeam,
    editTeam,
    submitScore,
    // --- Keep these for other components ---
    updateFixtures,
    updateKnockoutMatches,
  };
};