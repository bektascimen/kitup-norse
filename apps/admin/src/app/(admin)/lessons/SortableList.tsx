'use client';
import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { reorderLessons } from './actions';

type L = { id: string; day_number: number; title_key: string };

function Row({ l }: { l: L }) {
  const { setNodeRef, listeners, attributes, transform, transition } = useSortable({ id: l.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...listeners}
      {...attributes}
      className="p-3 bg-bgElevated rounded-md border border-border flex justify-between items-center cursor-grab"
    >
      <span>Day {l.day_number} — {l.title_key}</span>
      <Link href={`/lessons/${l.id}`} className="text-accent text-sm">Edit</Link>
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
        await reorderLessons(courseId, moved.map((m) => ({ id: m.id })));
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">{items.map((l) => <Row key={l.id} l={l} />)}</ul>
      </SortableContext>
    </DndContext>
  );
}
