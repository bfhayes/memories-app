import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Lock } from 'lucide-react';
import { api } from '../api/client';
import { useMemory } from '../context/MemoryContext';
import Photo from '../components/ui/Photo';
import Button from '../components/ui/Button';

export default function GatePage() {
  const { memory, memoryId } = useMemory();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!memory) return null;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.unlockMemory(memoryId, password);
      await qc.invalidateQueries({ queryKey: ['memory', memoryId] });
      // Gatekeeper re-renders into the identity picker / home.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-5 safe-top">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 self-start text-[16px] font-bold text-muted hover:text-ink">
        <ChevronLeft size={20} /> All memories
      </button>

      <div className="flex flex-1 flex-col items-center justify-center pb-12 text-center animate-fade-in-up">
        <Photo
          src={memory.coverThumbKey ? `/api/files/${memory.coverThumbKey}` : null}
          tone={memory.coverTone}
          className="h-24 w-24 rounded-[24px] shadow-feature"
        />
        <h1 className="mt-5 text-[25px] font-extrabold tracking-[-0.01em] text-ink">{memory.name}</h1>
        {memory.yearLabel && <p className="mt-1 text-[15px] font-medium text-muted2">{memory.yearLabel}</p>}

        <div className="mt-6 grid h-[60px] w-[60px] place-items-center rounded-full bg-tint text-terracotta">
          <Lock size={26} strokeWidth={2.2} />
        </div>
        <h2 className="mt-5 text-[22px] font-extrabold text-ink">This memory is private</h2>
        <p className="mt-2 max-w-xs text-[16px] leading-relaxed text-muted">
          Enter the password a family member texted you.
        </p>

        <form onSubmit={submit} className="mt-6 w-full">
          <input
            type="password"
            inputMode="text"
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="Password"
            className="h-[64px] w-full rounded-[16px] border-2 border-terracotta bg-white px-5 text-center text-[20px] font-bold tracking-wide text-ink placeholder:font-medium placeholder:tracking-normal placeholder:text-placeholder outline-none focus:ring-4 focus:ring-terracotta/15"
          />
          {error && <p className="mt-3 text-[15px] font-semibold text-[#A23D2F]">{error}</p>}
          <Button type="submit" block className="mt-4" disabled={submitting || !password}>
            {submitting ? 'Opening…' : 'Open Memory'}
          </Button>
        </form>

        <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-faint">
          Didn’t get a password? Ask whoever invited you to this memory.
        </p>
      </div>
    </div>
  );
}
