import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

export interface Profile {
  displayName: string;
  role: 'admin' | 'member';
}

interface AuthResult {
  error: Error | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    displayName: data.display_name ?? '',
    role: data.role ?? 'member',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialDone = false;

    async function initSession() {
      try {
        // getUser() validates the token server-side and refreshes if expired.
        // This is critical on cold start where the stored access token is stale.
        const { data: { user: validatedUser } } = await supabase.auth.getUser();

        if (!mounted || initialDone) return;
        initialDone = true;

        setUser(validatedUser);
        if (validatedUser) {
          const p = await fetchProfile(validatedUser.id);
          if (mounted) setProfile(p);
        }
      } catch {
        // No valid session — user needs to log in
      } finally {
        if (mounted && !initialDone) {
          initialDone = true;
        }
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION — we already handled it via getUser() above
      if (event === 'INITIAL_SESSION') return;

      // Ignore SIGNED_OUT events that weren't triggered by the user explicitly
      // signing out. A failed refreshSession() call can fire SIGNED_OUT and
      // wipe auth state even though the user is still reading.
      if (event === 'SIGNED_OUT') {
        if (intentionalSignOut.current) {
          intentionalSignOut.current = false;
          setUser(null);
          setProfile(null);
        }
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const p = await fetchProfile(currentUser.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }

  const intentionalSignOut = useRef(false);

  async function signOut() {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
