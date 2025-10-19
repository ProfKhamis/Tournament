import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@/components/Auth';
import { TournamentSelector } from '@/components/TournamentSelector';
import { TournamentPage } from './TournamentPage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sendEmailVerification, User } from 'firebase/auth';
import { ShieldAlert, LogOut, MailCheck, RefreshCw } from 'lucide-react'; // Added refresh icon

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
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // --- Check email verification status dynamically
  useEffect(() => {
    if (user) setIsVerified(user.emailVerified);
  }, [user]);

  // --- Auto countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // --- Send verification email
  const handleSendVerification = async () => {
    if (!user) return;
    if (resendCooldown > 0) {
      toast.message(`Please wait ${resendCooldown}s before resending.`);
      return;
    }

    try {
      await sendEmailVerification(user as User);
      toast.success('Verification email sent!', {
        description: 'Please check your inbox or spam folder.',
      });
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email.');
    }
  };

  // --- Refresh verification status
  const handleRefreshStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        setIsVerified(true);
        toast.success('Email verified ✅', { description: 'Admin access unlocked.' });
      } else {
        toast.error('Email not verified yet.', {
          description: 'Please check your inbox again.',
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error checking verification status.');
    } finally {
      setChecking(false);
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

  // --- Auth check
  if (!user) return <Auth />;

  // --- Email verification prompt
  if (!isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-sm mx-auto p-8 bg-card rounded-xl shadow-2xl border border-yellow-300/50 space-y-6 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-yellow-500" />

          <h2 className="text-xl font-bold text-card-foreground">
            Admin Access Denied
          </h2>

          <p className="text-sm text-muted-foreground">
            Your email <strong>{user.email}</strong> must be verified to access admin features.  
            Check your inbox or spam folder for a verification email.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSendVerification}
              disabled={resendCooldown > 0}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <MailCheck className="w-4 h-4 mr-2" />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
            </Button>

            <Button
              variant="outline"
              onClick={handleRefreshStatus}
              disabled={checking}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'I’ve Verified'}
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Tournament selection
  if (!selectedTournament) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <TournamentSelector
          onSelectTournament={(id, numberOfGroups) =>
            setSelectedTournament({ id, numberOfGroups })
          }
        />
      </div>
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
