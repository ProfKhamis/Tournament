import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Group, Match, Fixture, KnockoutMatch } from '@/types/tournament';

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

    const unsubGroups = onSnapshot(groupsRef, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group));
      setGroups(groupsData.sort((a, b) => a.name.localeCompare(b.name)));
    });

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
  }, [tournamentId]);

  const updateGroups = async (updatedGroups: Group[]) => {
    if (!tournamentId) return;
    
    for (const group of updatedGroups) {
      const groupRef = doc(db, 'tournaments', tournamentId, 'groups', group.id);
      await setDoc(groupRef, group);
    }
  };

  const updateMatches = async (updatedMatches: Match[]) => {
    if (!tournamentId) return;
    
    for (const match of updatedMatches) {
      const matchRef = doc(db, 'tournaments', tournamentId, 'matches', match.id);
      await setDoc(matchRef, match);
    }
  };

  const updateFixtures = async (updatedFixtures: Fixture[]) => {
    if (!tournamentId) return;
    
    for (const fixture of updatedFixtures) {
      const fixtureRef = doc(collection(db, 'tournaments', tournamentId, 'fixtures'));
      await setDoc(fixtureRef, fixture);
    }
  };

  const updateKnockoutMatches = async (updatedKnockout: KnockoutMatch[]) => {
    if (!tournamentId) return;
    
    for (const match of updatedKnockout) {
      const knockoutRef = doc(db, 'tournaments', tournamentId, 'knockout', match.id);
      await setDoc(knockoutRef, match);
    }
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
