"use client";

import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  user,
  profile,
  children,
}: {
  user: User | null;
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
}

export function useIsAdmin() {
  const { profile } = useUser();
  return profile?.role === "admin";
}
