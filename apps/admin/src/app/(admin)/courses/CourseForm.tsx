'use client';
import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertCourse } from './actions';

type Course = {
  id?: string; slug: string; title_key: string; description_key: string;
  day_count: number; difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived'; cover_image_url?: string | null;
};

export function CourseForm({ initial }: { initial?: Course }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => start(async () => {
        const r = await upsertCourse(fd);
        setError(r.ok ? null : r.error ?? 'failed');
      })}
      className="space-y-3"
    >
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}
      <Input name="slug" placeholder="slug" defaultValue={initial?.slug} required />
      <Input name="title_key" placeholder="title key" defaultValue={initial?.title_key} required />
      <Input name="description_key" placeholder="description key" defaultValue={initial?.description_key} required />
      <Input name="day_count" type="number" min={1} defaultValue={initial?.day_count ?? 21} required />
      <select name="difficulty" defaultValue={initial?.difficulty ?? 'beginner'} className="bg-bgElevated border border-border rounded-md p-2">
        <option>beginner</option><option>intermediate</option><option>advanced</option>
      </select>
      <select name="status" defaultValue={initial?.status ?? 'draft'} className="bg-bgElevated border border-border rounded-md p-2">
        <option>draft</option><option>published</option><option>archived</option>
      </select>
      <Input name="cover_image_url" placeholder="https://..." defaultValue={initial?.cover_image_url ?? ''} />
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
      {error && <p className="text-danger text-sm">{error}</p>}
    </form>
  );
}
