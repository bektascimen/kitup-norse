'use client';
import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { reorderLessons } from './actions';

type L = {
  id: string;
  day_number: number;
  title_key: string;
  /** Resolved TR title (or the raw key if missing). */
  title: string;
};

function Row({ l }: { l: L }) {
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: l.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-bgElevated/60 transition-colors ${isDragging ? 'opacity-60' : ''}`}
    >
      <span
        {...listeners}
        {...attributes}
        className="font-mono text-[10px] tracking-rune uppercase text-textLow w-6 cursor-grab active:cursor-grabbing select-none"
        aria-label="drag handle"
      >
        ≡
      </span>
      <span className="font-display text-[11px] tracking-carved uppercase text-accent w-12 leading-none">
        D {String(l.day_number).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[14px] tracking-tight text-textHigh truncate">{l.title}</p>
        <p className="font-mono text-[10px] text-textLow truncate">{l.title_key}</p>
      </div>
      <Link
        href={`/lessons/${l.id}`}
        className="font-display text-[10px] tracking-rune uppercase text-textMid hover:text-accent transition-colors px-3 py-1.5 rounded-md border border-border hover:border-accent/40"
      >
        Edit ›
      </Link>
    </li>
  );
}

export function SortableList({ courseId, items: initial }: { courseId: string; items: L[] }) {
  const [items, setItems] = useState(initial);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={async (e) => {
        if (!e.over || e.over.id === e.active.id) return;
        const oldIdx = items.findIndex((i) => i.id === e.active.id);
        const newIdx = items.findIndex((i) => i.id === e.over!.id);
        const moved = arrayMove(items, oldIdx, newIdx);
        setItems(moved);
        await reorderLessons(
          courseId,
          moved.map((m) => ({ id: m.id })),
        );
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {items.map((l) => (
            <Row key={l.id} l={l} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
