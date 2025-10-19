import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={20} className="text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};
