import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Editor, Range } from '@tiptap/react';
import { Loader2, Sparkles } from 'lucide-react';
import { filterCommands, filterCommandGroups } from '@/components/editor/SlashCommand/commands';
import type { SlashCommand } from '@/components/editor/types';
import { cn } from '@/lib/utils';
import { hasApiKey, streamComplete, type AIMessage } from '@/lib/ai';
import { getCommandPrompt, truncateContext } from '@/lib/ai/prompts';

interface SlashCommandMenuProps {
  editor: Editor;
  range: Range;
  onClose: () => void;
}

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ editor, range, onClose }, ref) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isExecutingAI, setIsExecutingAI] = useState(false);
    const [aiProgress, setAIProgress] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    const filteredCommands = filterCommands(query);
    const groupedCommands = filterCommandGroups(query);

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
      const selectedItem = itemRefs.current.get(selectedIndex);
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }, [selectedIndex]);

    // Execute AI command
    const executeAICommand = useCallback(async (command: SlashCommand) => {
      const commandId = command.id.replace('ai-', '');
      
      // Get context and selection
      const { from, to } = editor.state.selection;
      const selection = editor.state.doc.textBetween(from, to, ' ');
      const contextStart = Math.max(0, from - 500);
      const context = editor.state.doc.textBetween(contextStart, from, ' ');

      // Check if command requires selection
      const requiresSelection = ['improve', 'shorter', 'longer', 'fix', 'summarize', 'professional', 'casual', 'explain'].includes(commandId);
      
      if (requiresSelection && !selection) {
        alert('Please select some text first');
        return;
      }

      const textForPrompt = requiresSelection ? selection : truncateContext(context);
      const { system, user } = getCommandPrompt(commandId, context, textForPrompt);

      const messages: AIMessage[] = [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ];

      setIsExecutingAI(true);
      setAIProgress('');

      // Delete the slash command text
      editor.chain().focus().deleteRange(range).run();

      try {
        await streamComplete(messages, {
          onStart: () => {
            setAIProgress('Thinking...');
          },
          onToken: (token) => {
            setAIProgress((prev) => prev === 'Thinking...' ? token : prev + token);
            editor.chain().focus().insertContent(token).run();
          },
          onComplete: () => {
            setIsExecutingAI(false);
            setAIProgress('');
            onClose();
          },
          onError: (error) => {
            console.error('AI command error:', error);
            setIsExecutingAI(false);
            setAIProgress('');
            alert(`AI Error: ${error.message}`);
          },
        });
      } catch (error) {
        console.error('AI command failed:', error);
        setIsExecutingAI(false);
      }
    }, [editor, range, onClose]);

    const selectCommand = useCallback(
      async (command: SlashCommand) => {
        // Check if this is an AI command
        if (command.category === 'ai') {
          if (!hasApiKey()) {
            alert('Please configure your OpenAI API key in Settings');
            onClose();
            return;
          }
          await executeAICommand(command);
          return;
        }

        // Standard command
        editor.chain().focus().deleteRange(range).run();
        command.action(editor);
        onClose();
      },
      [editor, range, onClose, executeAICommand]
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent): boolean => {
        if (isExecutingAI) {
          if (event.key === 'Escape') {
            return true;
          }
          return true;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? filteredCommands.length - 1 : prev - 1
          );
          return true;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev >= filteredCommands.length - 1 ? 0 : prev + 1
          );
          return true;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          const command = filteredCommands[selectedIndex];
          if (command) {
            selectCommand(command);
          }
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return true;
        }

        return false;
      },
      [filteredCommands, selectedIndex, selectCommand, onClose, isExecutingAI]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: handleKeyDown,
    }));

    useEffect(() => {
      const updateQuery = () => {
        const from = range.from;
        const to = editor.state.selection.to;
        const text = editor.state.doc.textBetween(from, to, '');
        setQuery(text.slice(1));
      };
      updateQuery();
      
      const handler = () => updateQuery();
      editor.on('transaction', handler);
      
      return () => {
        editor.off('transaction', handler);
      };
    }, [editor, range.from]);

    // Show AI loading state
    if (isExecutingAI) {
      return (
        <div 
          ref={containerRef}
          className="w-72 bg-popover border-2 border-border shadow-lg"
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 border-2 border-tag-blue flex items-center justify-center">
                <Loader2 size={14} className="animate-spin text-tag-blue" />
              </div>
              <div>
                <p className="text-sm font-medium">AI Writing...</p>
                <p className="text-[10px] text-muted-foreground">Generating content</p>
              </div>
            </div>
            {aiProgress && (
              <div className="p-2 bg-muted border border-border text-xs text-muted-foreground max-h-24 overflow-y-auto">
                {aiProgress.slice(0, 100)}...
              </div>
            )}
          </div>
        </div>
      );
    }

    if (filteredCommands.length === 0) {
      return (
        <div 
          ref={containerRef}
          className="w-72 bg-popover border-2 border-border shadow-lg"
        >
          <div className="p-6 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            No commands found
          </div>
        </div>
      );
    }

    let flatIndex = 0;

    return (
      <div 
        ref={containerRef}
        className="w-72 max-h-80 overflow-hidden flex flex-col bg-popover border-2 border-border shadow-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2 border-b-2 border-border bg-card">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Commands
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <kbd className="px-1 py-0.5 text-[8px] font-bold bg-muted border border-border">↑↓</kbd>
            <kbd className="px-1 py-0.5 text-[8px] font-bold bg-muted border border-border">↵</kbd>
          </span>
        </div>
        
        {/* Commands List */}
        <div className="overflow-y-auto">
          {groupedCommands.map((group) => (
            <div key={group.category}>
              <div className={cn(
                "px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border",
                group.category === 'ai' && "bg-tag-blue/5 text-tag-blue"
              )}>
                {group.category === 'ai' && <Sparkles size={10} className="inline mr-1" />}
                {group.label}
              </div>
              {group.commands.map((command) => {
                const currentIndex = flatIndex++;
                const isSelected = currentIndex === selectedIndex;
                const Icon = command.icon;
                const isAICommand = command.category === 'ai';

                return (
                  <button
                    key={command.id}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(currentIndex, el);
                      } else {
                        itemRefs.current.delete(currentIndex);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors border-l-3",
                      isSelected 
                        ? "bg-card border-l-foreground" 
                        : "border-l-transparent hover:bg-card"
                    )}
                    onClick={() => selectCommand(command)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 border-2 transition-colors",
                      isSelected 
                        ? "border-foreground text-foreground" 
                        : "border-border text-muted-foreground",
                      isAICommand && "border-tag-blue text-tag-blue"
                    )}>
                      <Icon size={14} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block text-sm font-medium leading-tight",
                        isSelected ? "text-foreground" : "text-foreground"
                      )}>
                        {command.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground leading-tight truncate">
                        {command.description}
                      </span>
                    </div>
                    {command.shortcut && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold font-mono text-muted-foreground bg-muted border border-border">
                        {command.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';