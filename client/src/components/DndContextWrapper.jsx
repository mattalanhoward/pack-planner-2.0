// src/components/DndContextWrapper.jsx
import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

export function DndContextWrapper({ items, onDragEnd, children }) {
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          onDragEnd(oldIndex, newIndex);
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}