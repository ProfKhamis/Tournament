import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@/components/Auth';
import { TournamentSelector } from '@/components/TournamentSelector';
import { TournamentPage } from './TournamentPage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sendEmailVerification, User as FirebaseUser } from 'firebase/auth';

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  // --- Track cooldown countdown ---
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // --- Update verification status when user changes ---
  useEffect(() => {
    if (user) {
      setIsVerified(user.emailVerified);
    }
  }, [user]);

  // --- Send Verification Email with cooldown ---
  const handleSendVerification = async () => {
    if (!user) return;
    if (resendCooldown > 0) {
      toast.warning(`Please wait ${resendCooldown}s before resending.`);
      return;
    }

    try {
      await sendEmailVerification(user as FirebaseUser);
      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60); // 60-second cooldown
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please wait before trying again.');
      } else {
        toast.error(error.message || 'Failed to send verification email.');
      }
    }
  };

  // --- Check if email is verified (refresh user info) ---
  const handleCheckVerification = async () => {
    const currentUser = user as FirebaseUser | null;
    if (!currentUser) {
      toast.error('No user is currently signed in.');
      return;
    }

    try {
      setChecking(true);
      await currentUser.reload();
      if (currentUser.emailVerified) {
        toast.success('Email verified successfully! Redirecting...');
        setIsVerified(true);
      } else {
        toast.warning('Your email is still not verified. Please check your inbox.');
      }
    } catch (err: any) {
      toast.error('Failed to refresh verification status.');
    } finally {
      setChecking(false);
    }
  };

  // --- Logout ---
  const handleLogout = async () => {
    await logout();
    setSelectedTournament(null);
  };

  // --- Loader ---
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

  // --- Auth ---
  if (!user) return <Auth />;

  // --- Email Verification Required ---
  if (!isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
        <p className="mb-4 text-lg font-medium text-yellow-800 dark:text-yellow-100">
          Your email is not verified. Please verify to access the Admin Panel.
        </p>

        <Button
          onClick={handleSendVerification}
          disabled={resendCooldown > 0}
          className={`mb-4 w-full text-white dark:text-gray-100 ${
            resendCooldown > 0
              ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
              : 'bg-primary dark:bg-gray-700 hover:bg-primary/90'
          }`}
        >
          {resendCooldown > 0
            ? `Resend available in ${resendCooldown}s`
            : 'Resend Verification Email'}
        </Button>

        <Button
          onClick={handleCheckVerification}
          disabled={checking}
          className="mb-4 w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        >
          {checking ? 'Checking...' : 'Check Verification Status'}
        </Button>

        <Button variant="outline" onClick={handleLogout} className="w-full">
          Logout
        </Button>
      </div>
    );
  }

  // --- Tournament selection ---
  if (!selectedTournament) {
    return (
      <TournamentSelector
        onSelectTournament={(id, numberOfGroups) =>
          setSelectedTournament({ id, numberOfGroups })
        }
      />
    );
  }

// --- Tournament Page ---
return (
  <TournamentPage
    tournamentId={selectedTournament.id}
    numberOfGroups={selectedTournament.numberOfGroups}
    onBack={() => setSelectedTournament(null)}
  />
);
};
