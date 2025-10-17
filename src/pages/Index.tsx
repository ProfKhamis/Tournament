import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@/components/Auth';
import { TournamentSelector } from '@/components/TournamentSelector';
import { TournamentPage } from './TournamentPage';

const Index = () => {
  const { user, loading } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState<{ id: string; numberOfGroups: number } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!selectedTournament) {
    return (
      <TournamentSelector 
        onSelectTournament={(id, numberOfGroups) => setSelectedTournament({ id, numberOfGroups })} 
      />
    );
  }

  return (
    <TournamentPage 
      tournamentId={selectedTournament.id}
      numberOfGroups={selectedTournament.numberOfGroups}
      onBack={() => setSelectedTournament(null)}
    />
  );
};

export default Index;
