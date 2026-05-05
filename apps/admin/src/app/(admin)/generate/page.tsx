'use client';
import { useState } from 'react';
import { startGeneration, startTranslate } from './actions';
import { JobStatus } from './JobStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GeneratePage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-display mb-3">Generate course</h2>
        <form
          action={async (fd) => {
            const r = await startGeneration(fd);
            if (r.ok) setJobId(r.jobId!);
            else setError(r.error ?? 'failed');
          }}
          className="space-y-3"
        >
          <Input name="topic" placeholder="Topic (e.g. Greek Mythology)" required />
          <select
            name="difficulty"
            defaultValue="beginner"
            className="w-full bg-bgElevated border border-border rounded-md p-2"
          >
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
          <Input name="day_count" type="number" defaultValue={7} min={1} max={30} />
          <select
            name="locale"
            defaultValue="tr"
            className="w-full bg-bgElevated border border-border rounded-md p-2"
          >
            <option value="tr">Turkish</option>
            <option value="en">English</option>
          </select>
          <Button type="submit">Generate</Button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
        {jobId && (
          <div className="mt-4">
            <JobStatus jobId={jobId} />
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-display mb-3">Auto-translate</h2>
        <p className="text-textMid mb-3">Fill missing EN values from existing TR values.</p>
        <Button onClick={() => startTranslate()}>Translate TR → EN</Button>
      </section>
    </div>
  );
}
