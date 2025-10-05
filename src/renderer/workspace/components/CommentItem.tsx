import { Entry } from '../types/entry';
import { useEntryEditor } from '../hooks/useEntryEditor';
import { EditableEntry } from './EditableEntry';

interface CommentItemProps {
  comment: Entry;
  onUpdate: (updatedComment: Entry) => void;
  onDelete: (id: number) => void;
}

const electronAPI = (window as any).electronAPI;

export function CommentItem({ comment, onUpdate, onDelete }: CommentItemProps) {
  const {
    editor,
    isSubmitting,
    isEmpty,
    isEditing,
    handleSubmit,
    handleStartEdit,
    handleCancelEdit
  } = useEntryEditor({
    mode: 'update',
    entryId: comment.id,
    onSuccess: onUpdate,
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const result = await electronAPI.entry.delete(comment.id);

      if (result.success) {
        onDelete(comment.id);
      } else {
        console.error('Failed to delete comment:', result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <EditableEntry
      createdAt={comment.createdAt}
      contentHtml={comment.contentHtml}
      contentJson={comment.contentJson}
      editor={editor}
      isEditing={isEditing}
      isSubmitting={isSubmitting}
      isEmpty={isEmpty}
      onStartEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      editIconSize={14}
      deleteIconSize={14}
    />
  );
}
