import { useState } from 'react';
import { ChevronRight, Plus, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useMemory } from '../context/MemoryContext';
import { useContributors } from '../hooks/queries';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { Contributor } from '../lib/types';

export default function IdentityPage() {
  const { memory, memoryId, setIdentity } = useMemory();
  const qc = useQueryClient();
  const { data: contributors, isLoading } = useContributors(memoryId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (c: Contributor) => setIdentity(c);

  const createNew = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await api.addContributor(memoryId, name.trim());
      await qc.invalidateQueries({ queryKey: ['contributors', memoryId] });
      setIdentity(created);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-6 safe-top">
      {memory && (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sage-tint px-3.5 py-1.5 text-[14px] font-bold text-sage-dark">
          <span className="h-3 w-3 rounded-[4px]" style={{ background: memory.coverTone }} />
          {memory.name} · unlocked
        </span>
      )}

      <header className="mt-7">
        <h1 className="text-[33px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">Who are you?</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">
          Pick your name so we can credit what you add. We’ll remember you on this device.
        </p>
      </header>

      <div className="mt-7 flex flex-col gap-2.5">
        {isLoading ? (
          <div className="grid place-items-center py-10 text-terracotta"><Spinner size={26} /></div>
        ) : (
          (contributors ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c)}
              className="flex items-center gap-3.5 rounded-[18px] border border-line bg-white px-4 py-3 text-left shadow-card transition active:scale-[0.99] hover:shadow-feature"
            >
              <Avatar name={c.name} accent={c.accent} size={40} />
              <span className="flex-1 truncate text-[18px] font-extrabold text-ink">{c.name}</span>
              <ChevronRight size={20} className="text-chevron" />
            </button>
          ))
        )}
      </div>

      <div className="mt-4">
        {adding ? (
          <div className="rounded-[18px] border border-line bg-white p-3 shadow-card">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNew()}
              placeholder="Your name"
              className="h-[52px] w-full rounded-[14px] bg-sand px-4 text-[18px] font-semibold text-ink placeholder:text-placeholder outline-none focus:ring-4 focus:ring-terracotta/10"
            />
            <div className="mt-2.5 flex gap-2">
              <Button variant="outline" size="md" className="flex-1" onClick={() => { setAdding(false); setName(''); }}>
                Cancel
              </Button>
              <Button size="md" className="flex-1" onClick={createNew} disabled={busy || !name.trim()}>
                <Check size={18} strokeWidth={3} /> {busy ? 'Adding…' : 'That’s me'}
              </Button>
            </div>
          </div>
        ) : (
          <Button block onClick={() => setAdding(true)}>
            <Plus size={20} strokeWidth={2.8} /> I’m someone new
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-[14px] leading-relaxed text-faint">
        On a new phone or browser? Just pick your name again — nothing is lost.
      </p>
    </div>
  );
}
