import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '../api/client';
import { PHOTO_TONES } from '../lib/tones';
import Button from '../components/ui/Button';
import Brand from '../components/Brand';

export default function CreateMemoryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [yearLabel, setYearLabel] = useState('');
  const [password, setPassword] = useState('');
  const [tone, setTone] = useState(PHOTO_TONES[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Give this memory a name.');
    if (password.trim().length < 4) return setError('Use a password of at least 4 characters.');
    setSubmitting(true);
    try {
      const created = await api.createMemory({
        name: name.trim(),
        password: password.trim(),
        yearLabel: yearLabel.trim() || undefined,
        coverTone: tone,
      });
      await qc.invalidateQueries({ queryKey: ['memories'] });
      navigate(`/m/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-[16px] border border-line bg-white px-4 py-3.5 text-[17px] font-medium text-ink placeholder:text-placeholder focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 outline-none transition';
  const labelClass = 'mb-1.5 block text-[13px] font-bold uppercase tracking-[0.06em] text-faint';

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl px-5 pb-12 pt-6 safe-top sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-[16px] font-bold text-muted hover:text-ink">
          <ChevronLeft size={20} /> All memories
        </Link>
        <Brand compact />
      </div>

      <header className="mt-7">
        <h1 className="text-[31px] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink">Create a memory</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-muted">
          A private collection for one person or event. Share the password with family so they can add photos.
        </p>
      </header>

      <div className="mt-7 flex flex-col gap-5">
        <div>
          <label className={labelClass} htmlFor="name">Name</label>
          <input id="name" className={fieldClass} placeholder="e.g. Jeff Rice, or The Lake House"
            value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className={labelClass} htmlFor="years">Years <span className="normal-case text-placeholder">(optional)</span></label>
          <input id="years" className={fieldClass} placeholder="e.g. 1938 – 2024"
            value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input id="password" className={fieldClass} placeholder="A simple word the family will remember"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1.5 text-[14px] text-faint">You’ll share this with family so they can join.</p>
        </div>
        <div>
          <span className={labelClass}>Cover color</span>
          <div className="flex flex-wrap gap-2.5">
            {PHOTO_TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                aria-label={`Cover color ${t}`}
                className={clsx(
                  'h-11 w-11 rounded-[14px] tone-sheen relative transition active:scale-95',
                  tone === t && 'ring-2 ring-terracotta ring-offset-2 ring-offset-page',
                )}
                style={{ backgroundColor: t }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-[15px] font-semibold text-[#A23D2F]">{error}</p>}

        <Button block onClick={submit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create memory'}
        </Button>
      </div>
    </div>
  );
}
