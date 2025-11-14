"use client";

import React, { createContext, useContext, ReactNode } from "react";

type UserContextType = User | null;

const UserContext = createContext<UserContextType>(null);

type UserProviderProps = {
  children: ReactNode;
  user: User;
};

export function UserProvider({ children, user }: UserProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
