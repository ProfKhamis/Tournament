import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@/components/Auth';
import { TournamentSelector } from '@/components/TournamentSelector';
import { TournamentPage } from './TournamentPage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sendEmailVerification, User } from 'firebase/auth'; // 🔹 import the function

// 🟢 Custom Pulsing Dot Loader
const StylizedDotLoader = () => (
  <div className="flex space-x-2 justify-center items-center">
    <div className="w-5 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-5 h-5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
    <div className="w-5 h-5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
  </div>
);

export const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState<{ id: string; numberOfGroups: number } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // --- Check email verification status
  useEffect(() => {
    if (user) {
      setIsVerified(user.emailVerified);
    }
  }, [user]);

  const handleSendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user as User); // 🔹 correct way
       toast('Verification email sent! Check your inbox.');

      } catch (error: any) {
       toast.error(error.message || 'Failed to send verification email.');

      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setSelectedTournament(null);
  };

  // --- Loader
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-accent/20 p-6">
        <StylizedDotLoader />
        <div className="mt-8 text-2xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-pulse">
          EasyLeague
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-2">
          Initializing the tournament arena...
        </div>
      </div>
    );
  }

  // --- Auth
  if (!user) return <Auth />;

  // --- Email verification prompt
  if (!isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
        <p className="mb-4 text-lg font-medium text-yellow-800 dark:text-yellow-100">
          Your email is not verified. You cannot access the Admin Panel.
        </p>
        <Button onClick={handleSendVerification} className="mb-4">
          Resend Verification Email
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  // --- Tournament selection
  if (!selectedTournament) {
    return (
      <TournamentSelector
        onSelectTournament={(id, numberOfGroups) =>
          setSelectedTournament({ id, numberOfGroups })
        }
      />
    );
  }

  // --- Tournament Page
  return (
    <TournamentPage
      tournamentId={selectedTournament.id}
      numberOfGroups={selectedTournament.numberOfGroups}
      onBack={() => setSelectedTournament(null)}
    />
  );
};
