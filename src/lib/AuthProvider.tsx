"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, isAdmin: false, loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(email: string) {
    const { data } = await supabase.from("luma_admins").select("email").eq("email", email).single();
    return !!data;
  }

  useEffect(() => {
    // IMPORTANTE: nunca fazer `await` de chamadas do Supabase dentro do callback
    // do onAuthStateChange. O auth-js segura um lock enquanto espera o callback,
    // e qualquer query precisa desse mesmo lock pra obter o token -> deadlock
    // (o app ficava preso em "Carregando..." ao dar refresh logado).
    function applySession(u: User | null) {
      setUser(u);
      setLoading(false);
      if (u?.email) {
        const email = u.email;
        // Adia pra fora do lock de auth (fire-and-forget)
        setTimeout(() => {
          checkAdmin(email).then(setIsAdmin).catch(() => setIsAdmin(false));
        }, 0);
      } else {
        setIsAdmin(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message || null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
