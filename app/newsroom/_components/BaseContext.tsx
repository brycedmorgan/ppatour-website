"use client";

import { createContext, useContext } from "react";

/**
 * The dashboard's public base path ("/nr-…"). It comes from an env var the
 * browser never sees directly, so the server layout hands it down here.
 */
const BaseContext = createContext<string>("/404");

export function BaseProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <BaseContext.Provider value={base}>{children}</BaseContext.Provider>;
}

export const useBase = () => useContext(BaseContext);
