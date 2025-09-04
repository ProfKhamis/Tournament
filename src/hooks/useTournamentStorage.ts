import { useState, useEffect } from 'react';
import { Group, Match } from '@/types/tournament';
import { initialGroups } from '@/data/initialTournamentData';

interface TournamentData {
  groups: Group[];
  matches: Match[];
}

const STORAGE_KEY = 'tournament-data';

export const useTournamentStorage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: TournamentData = JSON.parse(savedData);
        setGroups(parsed.groups || initialGroups);
        setMatches(parsed.matches || []);
      } catch (error) {
        console.error('Failed to parse saved tournament data:', error);
        setGroups(initialGroups);
        setMatches([]);
      }
    } else {
      setGroups(initialGroups);
      setMatches([]);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (groups.length > 0) {
      const dataToSave: TournamentData = { groups, matches };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [groups, matches]);

  return {
    groups,
    matches,
    setGroups,
    setMatches,
  };
};