'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';

type Job = {
  id: string;
  status: string;
  output_ref: string | null;
  error_msg: string | null;
};

export function JobStatus({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
      .then(({ data }) => setJob(data as Job | null));

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generation_jobs', filter: `id=eq.${jobId}` },
        (payload) => setJob(payload.new as Job),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (!job) return <p className="text-textMid">Loading…</p>;
  return (
    <div className="p-4 bg-bgElevated rounded-md border border-border">
      <p className="font-medium">
        Status: <span className="text-accent">{job.status}</span>
      </p>
      {job.status === 'done' && job.output_ref && (
        <p className="text-sm text-textMid">Course id: {job.output_ref}</p>
      )}
      {job.status === 'failed' && (
        <pre className="text-danger text-xs whitespace-pre-wrap">{job.error_msg}</pre>
      )}
    </div>
  );
}
