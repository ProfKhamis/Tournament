import { Group, Team } from '@/types/tournament';

export const createTeam = (id: string, name: string): Team => ({
  id,
  name,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  goalDifference: 0,
});

export const createInitialGroups = (numberOfGroups: number): Group[] => {
  const groupNames = ['Group A', 'Group B', 'Group C', 'Group D'];
  const groups: Group[] = [];

  for (let i = 0; i < numberOfGroups; i++) {
    groups.push({
      id: `group-${String.fromCharCode(97 + i)}`,
      name: groupNames[i],
      teams: []
    });
  }

  return groups;
};

export const initialGroups: Group[] = [
  {
    id: 'group-a',
    name: 'Group A',
    teams: [], 
  },
  {
    id: 'group-b',
    name: 'Group B',
    teams: [], 
  },
  {
    id: 'group-c',
    name: 'Group C',
    teams: [],
  },
  {
    id: 'group-d',
    name: 'Group D',
    teams: [], 
  },
];