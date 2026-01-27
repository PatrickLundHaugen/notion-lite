import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { common, createLowlight } from 'lowlight';

import { SlashCommandExtension } from '@/components/editor/extensions/SlashCommand';
import type { SuggestionProps, SlashCommandRenderProps } from '@/components/editor/types';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// This will be set by the Editor component
let slashCommandRenderer: SlashCommandRenderProps | null = null;

export function setSlashCommandRenderer(renderer: SlashCommandRenderProps) {
  slashCommandRenderer = renderer;
}

// Create all extensions
export function createExtensions() {
  return [
    // Starter kit - includes bold, italic, strike, code, bulletList, orderedList, etc.
    // NOTE: StarterKit does NOT include Link or Underline by default
    StarterKit.configure({
      codeBlock: false, // We use CodeBlockLowlight instead
      heading: {
        levels: [1, 2, 3],
      },
    }),

    // Placeholder
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return 'Heading...';
        }
        return "Type '/' for commands...";
      },
      includeChildren: true,
    }),

    // Typography (smart quotes, dashes, etc.)
    Typography,

    // Text alignment
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),

    // Additional formatting not in StarterKit
    Highlight.configure({
      multicolor: false,
    }),
    TextStyle,
    Color,

    // Images
    Image.configure({
      inline: false,
      allowBase64: true,
    }),

    // Task lists (not in StarterKit)
    TaskList,
    TaskItem.configure({
      nested: true,
    }),

    // Code block with syntax highlighting
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'plaintext',
    }),

    // Slash commands
    SlashCommandExtension.configure({
      suggestion: {
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        render: () => {
          return {
            onStart: (props: SuggestionProps) => {
              slashCommandRenderer?.onStart(props);
            },
            onUpdate: (props: SuggestionProps) => {
              slashCommandRenderer?.onUpdate(props);
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              return slashCommandRenderer?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              slashCommandRenderer?.onExit();
            },
          };
        },
      },
    }),
  ];
}

export { SlashCommandExtension } from '@/components/editor/extensions/SlashCommand';
export type { SlashCommandRenderProps };