import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { demoEnabled, supabase } from '../lib/supabase';

interface AuthValue {
  isAdmin: boolean;
  loading: boolean;
  isDemo: boolean;
  user: User | { id: string; email: string } | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  enterDemo(): void;
}
const AuthContext = createContext<AuthValue | null>(null);
const DEMO_SESSION = 'apex-admin-demo-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthValue['user']>(null);
  const [isAdmin, setAdmin] = useState(false);
  const [isDemo, setDemo] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  const authVersion = useRef(0);

  useEffect(() => {
    if (!supabase) {
      if (demoEnabled && sessionStorage.getItem(DEMO_SESSION) === 'true') {
        setUser({ id: 'local-demo', email: 'demo@apexmotors.example' }); setAdmin(true); setDemo(true);
      }
      setLoading(false);
      return;
    }
    let mounted = true;
    const applyUser = async (next: User | null, current: number) => {
      if (!mounted || current !== authVersion.current) return;
      setUser(next); setAdmin(false); setLoading(true);
      try {
        if (next) {
          const { data, error } = await supabase!.from('profiles').select('role').eq('id', next.id).maybeSingle();
          if (mounted && current === authVersion.current) setAdmin(!error && data?.role === 'admin');
        }
      } catch {
        // A failed profile lookup never grants access or leaves the route loader running.
        if (mounted && current === authVersion.current) setAdmin(false);
      } finally {
        if (mounted && current === authVersion.current) setLoading(false);
      }
    };
    const initialVersion = authVersion.current;
    void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user ?? null, initialVersion)).catch(() => {
      if (mounted && initialVersion === authVersion.current) { setUser(null); setAdmin(false); setLoading(false); }
    });
    // Defer profile reads outside the auth callback to avoid an auth-client lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = ++authVersion.current;
      // Invalidate earlier profile requests synchronously, especially on sign out.
      setAdmin(false); setLoading(true);
      setTimeout(() => { if (mounted) void applyUser(session?.user ?? null, current); }, 0);
    });
    return () => { mounted = false; ++authVersion.current; subscription.unsubscribe(); };
  }, []);

  async function login(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not connected. Use the explicitly labeled demo workspace when available.');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    const current = authVersion.current;
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (current !== authVersion.current) throw new Error('The authentication session changed. Please try signing in again.');
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account does not have administrator access.');
    }
    setUser(data.user); setAdmin(true); setLoading(false);
  }
  async function logout() {
    ++authVersion.current;
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
    sessionStorage.removeItem(DEMO_SESSION); setUser(null); setAdmin(false); setDemo(false); setLoading(false);
  }
  function enterDemo() {
    if (!demoEnabled) throw new Error('The demo workspace is disabled. Configure Supabase authentication to continue.');
    ++authVersion.current;
    sessionStorage.setItem(DEMO_SESSION, 'true'); setUser({ id: 'local-demo', email: 'demo@apexmotors.example' }); setAdmin(true); setDemo(true);
  }
  return <AuthContext.Provider value={{ user, isAdmin, loading, isDemo, login, logout, enterDemo }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
