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
          // Check if this is a "New" account (created in last 45 seconds).
          // If account is older than 45s and has no profile, it is a "Zombie" (Deleted) account.
          // We log them out IMMEDIATELY without waiting for retries to avoid the 3s delay.
          
          const { data: authData } = await supabase.auth.getUser();
          const createdAt = authData.user?.created_at;
          const isNewUser = createdAt && (Date.now() - new Date(createdAt).getTime() < 45000);

          if (isNewUser && retryCount < 3) {
             // It's a new user, give the DB trigger a moment to create the profile
             console.log(`Profile not found (New User). Retrying (${retryCount + 1}/3)...`);
             setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
          } else {
             // Established account with no profile -> ZOMBIE -> IMMEDIATE LOGOUT
             console.warn("Profile missing for established user. Auto-cleaning zombie session.");
             setProfile(null);
             setLoading(false);
             await supabase.auth.signOut();
             setSession(null);
             // Force redirect to home to ensure clean state
             if (window.location.pathname !== '/') {
                 window.location.href = '/';
             }
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