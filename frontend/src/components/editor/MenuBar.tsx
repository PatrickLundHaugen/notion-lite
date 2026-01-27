import { memo } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuBarProps {
    editor: Editor;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon: Icon, label, isActive, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center justify-center size-8 transition-colors border",
        isActive 
          ? "bg-foreground text-background border-foreground" 
          : "bg-transparent text-muted-foreground border-transparent hover:border-border hover:text-foreground"
      )}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}

export const MenuBar = memo(function MenuBar({ editor }: MenuBarProps) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isStrike: ctx.editor.isActive('strike'),
      isCode: ctx.editor.isActive('code'),
      isHighlight: ctx.editor.isActive('highlight'),
    }),
  });

  return (
    <div className="inline-flex items-center bg-card border">
      <ToolbarButton
        icon={Bold}
        label="Bold (⌘B)"
        isActive={editorState.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic (⌘I)"
        isActive={editorState.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        isActive={editorState.isStrike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      
      <ToolbarButton
        icon={Code}
        label="Inline code (⌘E)"
        isActive={editorState.isCode}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={Highlighter}
        label="Highlight"
        isActive={editorState.isHighlight}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
    </div>
  );
});
