import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Milk, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    contactNumber?: string;
  }>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Redirect if already logged in
  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  // Show submitted screen after sign-up
  if (applicationSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md shadow-dairy text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">Application Submitted!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your application has been received. An admin will review it shortly.
              Once approved, you can log in with your credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full h-12"
              variant="outline"
              onClick={() => {
                setApplicationSubmitted(false);
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setFullName('');
                setContactNumber('');
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password email sent success screen
  if (forgotPasswordSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md shadow-dairy text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full h-12"
              variant="outline"
              onClick={() => {
                setForgotPasswordSent(false);
                setIsForgotPassword(false);
                setIsLogin(true);
                setEmail('');
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (isForgotPassword) {
    const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: typeof errors = {};
      try {
        emailSchema.parse(email);
      } catch (err) {
        if (err instanceof z.ZodError) newErrors.email = err.errors[0].message;
      }
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
          setForgotPasswordSent(true);
        }
      } catch {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md shadow-dairy">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Milk className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  disabled={loading}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <Button type="submit" className="h-12 w-full text-base font-medium" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending…</>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setErrors({}); }}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }

    if (!isLogin) {
      if (!fullName.trim()) newErrors.fullName = 'Please enter your full name';

      try {
        phoneSchema.parse(contactNumber.replace(/\s/g, ''));
      } catch (e) {
        if (e instanceof z.ZodError) newErrors.contactNumber = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message.includes('Invalid login credentials')
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
          navigate(from, { replace: true });
        }
      } else {
        // Sign up
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: error.message.includes('already registered') ? 'Account exists' : 'Sign up failed',
            description: error.message.includes('already registered')
              ? 'This email is already registered. Please log in instead.'
              : error.message,
            variant: 'destructive',
          });
          return;
        }

        // Get the newly created user session
        const { data: { user: newUser } } = await supabase.auth.getUser();

        if (newUser) {
          // Submit partner application
          const { error: appError } = await supabase
            .from('dairy_partner_applications')
            .insert({
              user_id: newUser.id,
              full_name: fullName,
              contact_number: contactNumber,
              email: email,
              status: 'pending',
            });

          if (appError) {
            console.error('Error submitting application:', appError);
          }
        }

        setApplicationSubmitted(true);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-dairy">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Milk className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            {isLogin ? 'Welcome Back' : 'Become a Partner'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Sign in to access your milk collection center'
              : 'Register as a collection partner. Your application will be reviewed by an admin.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                    disabled={loading}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="h-12"
                    disabled={loading}
                    maxLength={10}
                  />
                  {errors.contactNumber && (
                    <p className="text-sm text-destructive">{errors.contactNumber}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setErrors({}); }}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Submitting application...'}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Submit Application'}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Register as Partner"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
