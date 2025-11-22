import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track the last processed user ID to prevent redundant fetches on tab focus
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 0. Check configuration
    if (!isSupabaseConfigured) {
        setLoading(false);
        return;
    }

    // 1. Get Initial Session
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
           console.warn("Supabase init warning:", error.message);
           setLoading(false);
           return;
        }

        if (data && data.session) {
           setSession(data.session);
           lastUserIdRef.current = data.session.user.id;
           fetchProfile(data.session);
        } else {
           setLoading(false);
        }
      } catch (err) {
        console.warn("Supabase connection failed:", err);
        setLoading(false);
      }
    };

    initSession();

    // 2. Listen for Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update if the session state actually changes significantly (e.g. user changed, or signed out)
      const userId = session?.user?.id;
      
      if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setProfile(null);
          lastUserIdRef.current = null;
          setLoading(false);
      } else if (session) {
          setSession(session);
          // Optimization: Only fetch profile if user ID has changed or we don't have a profile yet
          if (userId !== lastUserIdRef.current || !profile) {
              lastUserIdRef.current = userId || null;
              fetchProfile(session);
          }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentSession: Session, retryCount = 0) => {
    if (!isSupabaseConfigured || !currentSession.user) return;
    const userId = currentSession.user.id;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
        setLoading(false);
      } else {
          // Profile missing.
          const createdAt = currentSession.user.created_at;
          const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime() < 45000);

          if (isNewUser && retryCount < 3) {
             // New user: Wait for DB trigger to create profile
             console.log(`Profile not found (New User). Retrying (${retryCount + 1}/3)...`);
             setTimeout(() => fetchProfile(currentSession, retryCount + 1), 1000);
          } else {
             // ZOMBIE ACCOUNT DETECTED
             // The Auth user exists, but the Profile is gone (and it's not a new signup).
             // Logic: We must CLEAN UP the auth user so the email is free to sign up again.
             console.warn("Zombie account detected (Auth exists, Profile missing). Cleaning up...");
             await cleanupZombieAccount();
          }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const cleanupZombieAccount = async () => {
      try {
          // Attempt to delete the auth user using the Secure RPC
          await supabase.rpc('delete_user');
          console.log("Zombie account cleaned up from Auth.");
      } catch (err) {
          console.error("Failed to auto-clean zombie account:", err);
      } finally {
          // Always sign out to reset the client state
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setLoading(false);
          // Optional: Alert the user
          alert("This account was previously deleted. Please Sign Up again to create a new profile.");
      }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    lastUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};