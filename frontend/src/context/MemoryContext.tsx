import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, setActiveContributor } from '../api/client';
import { getIdentity, setIdentity as persistIdentity, clearIdentity as clearStored } from '../lib/identity';
import type { Contributor, MemoryDetail } from '../lib/types';

interface MemoryContextValue {
  memoryId: number;
  memory: MemoryDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  unlocked: boolean;
  identity: Contributor | null;
  setIdentity: (c: Contributor) => void;
  clearIdentity: () => void;
}

const Ctx = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ memoryId, children }: { memoryId: number; children: ReactNode }) {
  const { data: memory, isLoading, isError } = useQuery({
    queryKey: ['memory', memoryId],
    queryFn: () => api.getMemory(memoryId),
    enabled: memoryId > 0,
  });

  const [identity, setIdentityState] = useState<Contributor | null>(() => getIdentity(memoryId));

  // Keep identity in sync when navigating between memories.
  useEffect(() => {
    setIdentityState(getIdentity(memoryId));
  }, [memoryId]);

  // Attribute writes to the active identity.
  useEffect(() => {
    setActiveContributor(identity?.id ?? null);
    return () => setActiveContributor(null);
  }, [identity]);

  const value: MemoryContextValue = {
    memoryId,
    memory,
    isLoading,
    isError,
    unlocked: !!memory?.unlocked,
    identity,
    setIdentity: (c) => {
      persistIdentity(memoryId, c);
      setIdentityState(c);
    },
    clearIdentity: () => {
      clearStored(memoryId);
      setIdentityState(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMemory(): MemoryContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMemory must be used within MemoryProvider');
  return v;
}
