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

export const initialGroups: Group[] = [
  {
    id: 'group-a',
    name: 'Group A',
    teams: [
      createTeam('team-1', 'LEGEND KILLER'),
      createTeam('team-2', 'MBOMBOCLAT'),
      createTeam('team-3', 'ÇEÅSER'),
      createTeam('team-4', 'TYCOON'),
    ],
  },
  {
    id: 'group-b',
    name: 'Group B',
    teams: [
      createTeam('team-5', 'PUMAS FC'),
      createTeam('team-6', 'FCMKHI99'),
      createTeam('team-7', 'SCAVANGERS'),
      createTeam('team-8', 'MEGA 😡'),
    ],
  },
  {
    id: 'group-c',
    name: 'Group C',
    teams: [
      createTeam('team-9', 'JEONJU G'),
      createTeam('team-10', 'A-L-F-R-3-D'),
      createTeam('team-11', 'FARO BV'),
      createTeam('team-12', 'CHELSEA'),
    ],
  },
  {
    id: 'group-d',
    name: 'Group D',
    teams: [
      createTeam('team-13', 'THE RALPH'),
      createTeam('team-14', 'MANCHESTER UNITED'),
      createTeam('team-15', 'LONDON BUOY'),
      createTeam('team-16', 'SHAKUR254'),
    ],
  },
  {
    id: 'group-e',
    name: 'Group E',
    teams: [
      createTeam('team-17', 'HAVE MERCY'),
      createTeam('team-18', 'LEFTFOOT MAGIC'),
      createTeam('team-19', 'ALLAN FC'),
      createTeam('team-20', 'ÜNRÜLLY'),
    ],
  },
];