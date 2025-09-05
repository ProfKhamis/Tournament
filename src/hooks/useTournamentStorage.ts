import { useState, useEffect } from 'react';
import { Group, Match, Fixture } from '@/types/tournament';
import { initialGroups } from '@/data/initialTournamentData';

interface TournamentData {
  groups: Group[];
  matches: Match[];
  fixtures: Fixture[];
}

const STORAGE_KEY = 'tournament-data';

export const useTournamentStorage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: TournamentData = JSON.parse(savedData);
        setGroups(parsed.groups || initialGroups);
        setMatches(parsed.matches || []);
        setFixtures(parsed.fixtures || []);
      } catch (error) {
        console.error('Failed to parse saved tournament data:', error);
        setGroups(initialGroups);
        setMatches([]);
        setFixtures([]);
      }
    } else {
      setGroups(initialGroups);
      setMatches([]);
      setFixtures([]);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (groups.length > 0) {
      const dataToSave: TournamentData = { groups, matches, fixtures };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [groups, matches, fixtures]);

  return {
    groups,
    matches,
    fixtures,
    setGroups,
    setMatches,
    setFixtures,
  };
};