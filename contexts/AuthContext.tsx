import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
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
           fetchProfile(data.session.user.id);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    if (!isSupabaseConfigured) return;
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
          // Profile not found.
          // This could be a "Zombie Account" (Auth exists, but profile deleted) OR a new signup pending trigger.
          // We try 3 times (waiting 1s each) to allow the DB trigger to create the profile.
          if (retryCount < 3) {
             console.log(`Profile not found. Retrying (${retryCount + 1}/3)...`);
             setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
          } else {
             // If after 3 seconds we still have no profile, this is a Zombie Account.
             console.warn("Profile missing for authenticated user. Auto-cleaning zombie session.");
             setProfile(null);
             setLoading(false);
             // FORCE LOGOUT to fix the "Deleted account can still login" bug
             await supabase.auth.signOut();
             setSession(null);
          }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
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