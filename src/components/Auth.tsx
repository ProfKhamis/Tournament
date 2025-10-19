import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Chrome, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { auth } from '@/config/firebase';
import { sendEmailVerification, User as FirebaseUser } from 'firebase/auth';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  // --- Handle Login / Signup ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);

        const currentUser = auth.currentUser as FirebaseUser | null;
        if (!currentUser?.emailVerified) {
          toast.error('Please verify your email before accessing the dashboard.');
          await sendEmailVerification(currentUser);
          setShowVerificationPrompt(true);
          setIsLoading(false);
          return;
        }

        toast.success('Login successful! Welcome back.');
      } else {
        await signUp(email, password);
        toast.success('Account created! Check your email to verify before logging in.');
        const currentUser = auth.currentUser as FirebaseUser | null;
        if (currentUser && !currentUser.emailVerified) {
          await sendEmailVerification(currentUser);
          setShowVerificationPrompt(true);
        }
      }
    } catch (error: any) {
      const message = error.message.includes('auth/')
        ? error.message.split('auth/')[1].replace(/[-]/g, ' ').replace(/[()]/g, '')
        : 'Authentication failed. Please check your details.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Google Sign-in ---
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      const currentUser = auth.currentUser as FirebaseUser | null;
      if (!currentUser?.emailVerified) {
        toast.error('Please verify your email before accessing the dashboard.');
        await sendEmailVerification(currentUser);
        setShowVerificationPrompt(true);
        setIsLoading(false);
        return;
      }
      toast.success('Signed in with Google successfully! 🎉');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Toggle between Login and Signup ---
  const toggleAuthMode = () => {
    setEmail('');
    setPassword('');
    setIsLogin(prev => !prev);
    setShowVerificationPrompt(false);
  };

  // --- Render Verification Prompt ---
  if (showVerificationPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-sm shadow-xl flex flex-col dark:bg-gray-800 dark:border-gray-700 p-6 text-center">
          <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Email Verification Required</h2>
          <p className="text-sm text-muted-foreground mb-6 dark:text-gray-300">
            A verification email has been sent to <strong>{email}</strong>. Please check your inbox and click the verification link to access the dashboard.
          </p>
          <Button
            onClick={async () => {
              const currentUser = auth.currentUser as FirebaseUser | null;
              if (currentUser) {
                await sendEmailVerification(currentUser);
                toast.success('Verification email resent! Check your inbox.');
              }
            }}
            className="mb-4 w-full bg-primary text-white dark:bg-gray-700 dark:text-gray-100"
          >
            Resend Verification Email
          </Button>
          <Button variant="outline" onClick={toggleAuthMode} className="w-full">
            Back to {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </Card>
      </div>
    );
  }

  // --- Render Login/Signup Form ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-sm shadow-xl transition-all duration-700 ease-in-out flex flex-col dark:bg-gray-800 dark:border-gray-700"
        style={{ height: isLogin ? '480px' : '530px' }}>
        <CardHeader className="text-center pt-8 pb-4 flex-shrink-0">
          <CardTitle className="text-2xl font-semibold dark:text-gray-100">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Sign in to your admin dashboard' : 'Create a new admin account'}
          </p>
        </CardHeader>

        <CardContent className="flex-grow">
          <div key={isLogin.toString()} className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">

            {/* Google Sign-in */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-white border-gray-300 hover:bg-gray-50 text-base font-medium dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.03c0-.77-.07-1.48-.19-2.16h-10.37v4.06h5.83c-.28 1.48-1.12 2.76-2.38 3.63v3.08h3.98c2.33-2.14 3.66-5.26 3.66-9.14z" fill="#4285F4"/>
                <path d="M12.03 23c3.31 0 6.09-1.09 8.08-3.04l-3.98-3.08c-1.11.75-2.5 1.19-4.1 1.19-3.17 0-5.88-2.14-6.85-5.01H1.08v3.17c2.01 3.97 6.01 6.84 10.95 6.84z" fill="#34A853"/>
                <path d="M5.18 14.18c-.25-.76-.39-1.57-.39-2.39s.14-1.63.39-2.39V6.23H1.08c-.76 1.52-1.08 3.25-1.08 4.98s.32 3.46 1.08 4.98l4.1-3.17z" fill="#FBBC05"/>
                <path d="M12.03 5.37c1.8-.02 3.4.63 4.67 1.83l3.47-3.37C18.12 1.43 15.35.03 12.03 0c-4.94 0-8.94 2.87-10.95 6.84l4.1 3.17c.97-2.87 3.68-5.01 6.85-5.01z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-gray-500 dark:text-gray-400 dark:bg-gray-800">OR</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              <div className="relative">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              {!isLogin && (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    className="pl-10 h-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 text-base font-semibold bg-black hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Chrome className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    {isLogin ? 'Log In' : 'Sign Up'}
                  </>
                )}
              </Button>
            </form>

            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-gray-100 p-0 h-auto"
              onClick={toggleAuthMode}
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};
