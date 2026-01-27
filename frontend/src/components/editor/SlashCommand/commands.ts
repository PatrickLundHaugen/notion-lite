import type { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Image,
  Sparkles,
  Minimize2,
  Maximize2,
  CheckCircle,
  ArrowRight,
  FileText,
  Briefcase,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import type { SlashCommand, SlashCommandGroup, CommandCategory } from '@/components/editor/types';
import { hasApiKey } from '@/lib/ai';

// ============================================
// Standard Commands
// ============================================

export const slashCommands: SlashCommand[] = [
  // Text blocks
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Just start writing with plain text',
    icon: Type,
    category: 'text',
    keywords: ['paragraph', 'text', 'plain', 'p'],
    action: (editor: Editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    category: 'text',
    keywords: ['h1', 'heading', 'heading1', 'title', 'large', '1'],
    shortcut: '#',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    category: 'text',
    keywords: ['h2', 'heading', 'heading2', 'subtitle', 'medium', '2'],
    shortcut: '##',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    category: 'text',
    keywords: ['h3', 'heading', 'heading3', 'small', '3'],
    shortcut: '###',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote or excerpt',
    icon: Quote,
    category: 'text',
    keywords: ['quote', 'blockquote', 'excerpt', 'cite'],
    shortcut: '>',
    action: (editor: Editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visual break between sections',
    icon: Minus,
    category: 'text',
    keywords: ['divider', 'separator', 'hr', 'line', 'break', 'horizontal'],
    shortcut: '---',
    action: (editor: Editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },

  // Lists
  {
    id: 'bullet-list',
    label: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: List,
    category: 'lists',
    keywords: ['bullet', 'list', 'unordered', 'ul', 'bullets'],
    shortcut: '-',
    action: (editor: Editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    category: 'lists',
    keywords: ['numbered', 'list', 'ordered', 'ol', 'numbers'],
    shortcut: '1.',
    action: (editor: Editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: 'task-list',
    label: 'Task List',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    category: 'lists',
    keywords: ['task', 'todo', 'checkbox', 'checklist', 'tasks'],
    shortcut: '[]',
    action: (editor: Editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },

  // Media
  {
    id: 'code',
    label: 'Code Block',
    description: 'Add code with syntax highlighting',
    icon: Code,
    category: 'media',
    keywords: ['code', 'codeblock', 'pre', 'syntax', 'snippet'],
    shortcut: '```',
    action: (editor: Editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Embed an image from URL',
    icon: Image,
    category: 'media',
    keywords: ['image', 'picture', 'photo', 'img'],
    action: (editor: Editor) => {
      const url = window.prompt('Enter image URL');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

// ============================================
// AI Commands (only shown when API key is configured)
// ============================================

export const aiSlashCommands: SlashCommand[] = [
  {
    id: 'ai-improve',
    label: 'Improve Writing',
    description: 'Enhance clarity and flow',
    icon: Sparkles,
    category: 'ai',
    keywords: ['ai', 'improve', 'enhance', 'better', 'rewrite'],
    action: () => {}, // Action handled by AI system
  },
  {
    id: 'ai-shorter',
    label: 'Make Shorter',
    description: 'Condense selected text',
    icon: Minimize2,
    category: 'ai',
    keywords: ['ai', 'shorter', 'condense', 'brief'],
    action: () => {},
  },
  {
    id: 'ai-longer',
    label: 'Make Longer',
    description: 'Expand with more detail',
    icon: Maximize2,
    category: 'ai',
    keywords: ['ai', 'longer', 'expand', 'elaborate'],
    action: () => {},
  },
  {
    id: 'ai-fix',
    label: 'Fix Grammar',
    description: 'Correct spelling and grammar',
    icon: CheckCircle,
    category: 'ai',
    keywords: ['ai', 'fix', 'grammar', 'spelling'],
    action: () => {},
  },
  {
    id: 'ai-continue',
    label: 'Continue Writing',
    description: 'Let AI continue from here',
    icon: ArrowRight,
    category: 'ai',
    keywords: ['ai', 'continue', 'write', 'next'],
    action: () => {},
  },
  {
    id: 'ai-summarize',
    label: 'Summarize',
    description: 'Create a brief summary',
    icon: FileText,
    category: 'ai',
    keywords: ['ai', 'summarize', 'summary', 'tldr'],
    action: () => {},
  },
  {
    id: 'ai-professional',
    label: 'Professional Tone',
    description: 'Rewrite in formal style',
    icon: Briefcase,
    category: 'ai',
    keywords: ['ai', 'professional', 'formal', 'business'],
    action: () => {},
  },
  {
    id: 'ai-casual',
    label: 'Casual Tone',
    description: 'Rewrite in friendly style',
    icon: MessageCircle,
    category: 'ai',
    keywords: ['ai', 'casual', 'friendly', 'informal'],
    action: () => {},
  },
  {
    id: 'ai-explain',
    label: 'Explain',
    description: 'Explain in simple terms',
    icon: HelpCircle,
    category: 'ai',
    keywords: ['ai', 'explain', 'simplify', 'clarify'],
    action: () => {},
  },
];

// ============================================
// Get all commands (including AI if configured)
// ============================================

export function getAllCommands(): SlashCommand[] {
  if (hasApiKey()) {
    return [...slashCommands, ...aiSlashCommands];
  }
  return slashCommands;
}

// ============================================
// Command Groups
// ============================================

export function getCommandGroups(): SlashCommandGroup[] {
  const allCommands = getAllCommands();
  
  const groups: SlashCommandGroup[] = [
    {
      category: 'text',
      label: 'Text',
      commands: allCommands.filter((c) => c.category === 'text'),
    },
    {
      category: 'lists',
      label: 'Lists',
      commands: allCommands.filter((c) => c.category === 'lists'),
    },
    {
      category: 'media',
      label: 'Media',
      commands: allCommands.filter((c) => c.category === 'media'),
    },
  ];

  // Add AI group if API key is configured
  const aiCommands = allCommands.filter((c) => c.category === 'ai');
  if (aiCommands.length > 0) {
    groups.unshift({
      category: 'ai' as CommandCategory,
      label: 'AI Assistant',
      commands: aiCommands,
    });
  }

  return groups.filter((group) => group.commands.length > 0);
}

// Legacy exports for backwards compatibility
export const commandGroups: SlashCommandGroup[] = [
  {
    category: 'text',
    label: 'Text',
    commands: slashCommands.filter((c) => c.category === 'text'),
  },
  {
    category: 'lists',
    label: 'Lists',
    commands: slashCommands.filter((c) => c.category === 'lists'),
  },
  {
    category: 'media',
    label: 'Media',
    commands: slashCommands.filter((c) => c.category === 'media'),
  },
  {
    category: 'advanced',
    label: 'Callouts',
    commands: slashCommands.filter((c) => c.category === 'advanced'),
  },
];

// ============================================
// Filter functions
// ============================================

export function filterCommands(query: string): SlashCommand[] {
  const allCommands = getAllCommands();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return allCommands;
  }

  return allCommands.filter((command) => {
    if (command.label.toLowerCase().includes(lowerQuery)) return true;
    if (command.id.toLowerCase().includes(lowerQuery)) return true;
    if (command.description.toLowerCase().includes(lowerQuery)) return true;
    if (command.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))) return true;
    return false;
  });
}

export function filterCommandGroups(query: string): SlashCommandGroup[] {
  const filtered = filterCommands(query);
  const groups = getCommandGroups();
  
  return groups
    .map((group) => ({
      ...group,
      commands: group.commands.filter((cmd) => filtered.includes(cmd)),
    }))
    .filter((group) => group.commands.length > 0);
}