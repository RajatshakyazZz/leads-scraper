"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider, hasFirebaseClientConfig } from "@/lib/firebase-client";
import type { AccountQuota } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  quota: AccountQuota | null;
  loading: boolean;
  firebaseConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string>;
  refreshAccount: () => Promise<void>;
  updateQuota: (quota: AccountQuota) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJson(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<AccountQuota | null>(null);
  const [loading, setLoading] = useState(hasFirebaseClientConfig);
  const [authError, setAuthError] = useState<string | null>(
    hasFirebaseClientConfig ? null : "Sign-in is not configured for this environment.",
  );

  const refreshAccountForUser = useCallback(async (nextUser: User) => {
    const token = await nextUser.getIdToken();
    const res = await fetch("/api/account", {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);

    if (!res.ok) {
      throw new Error(data.error ?? "Unable to load account quota.");
    }

    setQuota(data.quota);
    setAuthError(null);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!user) return;
    await refreshAccountForUser(user);
  }, [refreshAccountForUser, user]);

  useEffect(() => {
    if (!hasFirebaseClientConfig) {
      return;
    }

    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setQuota(null);

      if (!nextUser) {
        setLoading(false);
        setAuthError(null);
        return;
      }

      try {
        await refreshAccountForUser(nextUser);
      } catch (e) {
        setAuthError((e as Error).message);
        // If quota failed to load (e.g. Firebase Admin not configured),
        // provide a default so the UI doesn't show 0 remaining.
        if (!quota) {
          setQuota({ leadLimit: 15, leadsUsed: 0, remaining: 15 });
        }
      } finally {
        setLoading(false);
      }
    });
  }, [refreshAccountForUser]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signInWithPopup(auth, getGoogleProvider());
  }, []);

  const signOutUser = useCallback(async () => {
    if (!hasFirebaseClientConfig) return;
    await signOut(getFirebaseAuth());
    setQuota(null);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) throw new Error("Sign in with Google before scraping leads.");
    return user.getIdToken();
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      quota,
      loading,
      firebaseConfigured: hasFirebaseClientConfig,
      authError,
      signInWithGoogle,
      signOutUser,
      getIdToken,
      refreshAccount,
      updateQuota: setQuota,
    }),
    [authError, getIdToken, loading, quota, refreshAccount, signInWithGoogle, signOutUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
