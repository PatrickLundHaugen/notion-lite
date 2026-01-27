import { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { formatDistanceToNow, format } from 'date-fns';
import type { PageVersion } from './types';

interface VersionPreviewProps {
    version: PageVersion;
}

export function VersionPreview({ version }: VersionPreviewProps) {
    // Create read-only editor instance
    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
        ],
        content: version.content || '',
        editable: false,
        editorProps: {
            attributes: {
                class: 'noteflow-editor outline-none',
            },
        },
    }, [version.content]);

    const formattedDate = useMemo(() => {
        const date = new Date(version.created_at);
        return {
            relative: formatDistanceToNow(date, { addSuffix: true }),
            absolute: format(date, 'PPpp'), // e.g., "Jan 15, 2025, 2:30 PM"
        };
    }, [version.created_at]);

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 bg-card">
                <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-muted-foreground">
            Version Preview
          </span>
                    <span className="text-sm text-muted-foreground" title={formattedDate.absolute}>
            {formattedDate.relative}
          </span>
                </div>
                <h3 className="text-lg font-bold truncate">
                    {version.title || 'Untitled'}
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {version.content ? (
                    <EditorContent editor={editor} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            This version has no content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}