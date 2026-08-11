"use client";

import { createContext, useContext } from "react";
import { useWallet, type WalletApi } from "./useWallet";

const WalletContext = createContext<WalletApi | null>(null);

/**
 * Живе в root layout, а не на сторінці: layout при переходах між табами не
 * перемонтовується, тому localStorage читається один раз, і «Податки» ↔ «Активи»
 * перемикаються миттєво, без спінера й без повторної гідрації стану.
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletState(): WalletApi {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("useWalletState використовується поза <WalletProvider>");
  return wallet;
}
