import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Group, Match, Fixture, KnockoutMatch } from '@/types/tournament';

// Helper function to create an initial group
const createInitialGroup = (index: number): Group => {
  const groupLetter = String.fromCharCode(65 + index); // A, B, C...
  return {
    id: `group-${groupLetter}`,
    name: `Group ${groupLetter}`,
    teams: [], // Start with no teams
  };
};

export const useTournament = (tournamentId: string | null, numberOfGroups: number) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);

  useEffect(() => {
    if (!tournamentId) return;

    const groupsRef = collection(db, 'tournaments', tournamentId, 'groups');
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches');
    const fixturesRef = collection(db, 'tournaments', tournamentId, 'fixtures');
    const knockoutRef = collection(db, 'tournaments', tournamentId, 'knockout');

    // Groups Listener with Initialization Logic
    const unsubGroups = onSnapshot(groupsRef, async (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group));

      if (groupsData.length === 0) {
        // ⭐ FIX: Initialize groups if the subcollection is empty (new tournament)
        const initialGroups: Group[] = [];
        for (let i = 0; i < numberOfGroups; i++) {
          const newGroup = createInitialGroup(i);
          initialGroups.push(newGroup);
          
          // Persist the new group to Firestore
          const groupDocRef = doc(groupsRef, newGroup.id);
          await setDoc(groupDocRef, newGroup);
        }
        // State update will now happen via the next snapshot
        
      } else {
        // Existing data: just update state
        setGroups(groupsData.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
    // ... (rest of the listeners remain the same)

    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Match));
      setMatches(matchesData);
    });

    const unsubFixtures = onSnapshot(fixturesRef, (snapshot) => {
      const fixturesData = snapshot.docs.map(doc => doc.data() as Fixture);
      setFixtures(fixturesData);
    });

    const unsubKnockout = onSnapshot(knockoutRef, (snapshot) => {
      const knockoutData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as KnockoutMatch));
      setKnockoutMatches(knockoutData);
    });

    return () => {
      unsubGroups();
      unsubMatches();
      unsubFixtures();
      unsubKnockout();
    };
  }, [tournamentId, numberOfGroups]); // Added numberOfGroups to dependencies

  // ... (update functions remain the same)

  const updateGroups = async (updatedGroups: Group[]) => {
    if (!tournamentId) return;
    
    // Using a Promise.all for faster writes
    await Promise.all(updatedGroups.map(group => 
      setDoc(doc(db, 'tournaments', tournamentId!, 'groups', group.id), group)
    ));
  };

  const updateMatches = async (updatedMatches: Match[]) => {
    if (!tournamentId) return;
    
    // Assuming your update logic for matches might need refinement depending on use case.
    // For simplicity, we'll map and write all.
    await Promise.all(updatedMatches.map(match =>
      setDoc(doc(db, 'tournaments', tournamentId!, 'matches', match.id), match)
    ));
  };
    
  const updateFixtures = async (updatedFixtures: Fixture[]) => {
    // NOTE: This implementation creates a new fixture document every time, 
    // which is likely not what you want if you're trying to update existing ones. 
    // It's left as is to match your original, but generally, fixtures should be 
    // identified by an ID for updates/overwrites.
    if (!tournamentId) return;
    
    for (const fixture of updatedFixtures) {
      const fixtureRef = doc(collection(db, 'tournaments', tournamentId, 'fixtures'));
      await setDoc(fixtureRef, fixture);
    }
  };

  const updateKnockoutMatches = async (updatedKnockout: KnockoutMatch[]) => {
    if (!tournamentId) return;
    
    await Promise.all(updatedKnockout.map(match =>
      setDoc(doc(db, 'tournaments', tournamentId!, 'knockout', match.id), match)
    ));
  };


  return {
    groups,
    matches,
    fixtures,
    knockoutMatches,
    updateGroups,
    updateMatches,
    updateFixtures,
    updateKnockoutMatches
  };
};