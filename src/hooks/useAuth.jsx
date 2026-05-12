import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(user) {
    if (!isSupabaseConfigured || !user) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    const pendingRole = window.localStorage.getItem('wasatify.pendingRole') || user.user_metadata?.role || 'student';
    const fallbackProfile = {
      id: user.id,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna WASATIFY',
      email: user.email,
      role: pendingRole,
      class_name: user.user_metadata?.class_name || null,
      school: user.user_metadata?.school || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert(fallbackProfile)
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    window.localStorage.removeItem('wasatify.pendingRole');
    setProfile(inserted);
    return inserted;
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      if (data.session?.user) {
        try {
          await loadProfile(data.session.user);
        } catch (error) {
          console.error('Failed to load profile', error);
          setProfile(null);
        }
      }
      setLoading(false);
    }

    init();

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          await loadProfile(nextSession.user);
        } catch (error) {
          console.error('Failed to refresh profile', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      isAuthenticated: Boolean(session?.user),
      refreshProfile: () => (session?.user ? loadProfile(session.user) : null),
      signOut,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
