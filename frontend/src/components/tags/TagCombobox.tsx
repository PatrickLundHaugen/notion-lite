import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tag as TagComponent, TagLabel, TAG_COLORS, TAG_BG_COLORS } from '@/components/tags/Tag';
import { type TagData } from '@/components/tags/types';

interface TagComboboxProps {
    availableTags: TagData[];
    selectedTagIds: number[];
    onAddTag: (tagName: string, color: string) => void;
    onRemoveTag: (tagId: number) => void;
}

export function TagCombobox({ availableTags, selectedTagIds, onAddTag, onRemoveTag }: TagComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>('blue');

    const filteredTags = availableTags.filter(
        (tag) => tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const exactMatch = filteredTags.find(
        (tag) => tag.name.toLowerCase() === search.toLowerCase()
    );

    const isNewTag = search.trim().length > 0 && !exactMatch;

    const handleToggleTag = (tag: TagData) => {
        if (selectedTagIds.includes(tag.id)) {
            onRemoveTag(tag.id);
        } else {
            onAddTag(tag.name, tag.color);
        }
        setSearch('');
    };

    const handleCreateTag = () => {
        if (search.trim()) {
            onAddTag(search.trim(), selectedColor);
            setSearch('');
            setSelectedColor('blue');
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    + Add Tag
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 rounded-none border-2 border-border" align="start">
                <Command shouldFilter={false} className="rounded-none">
                    <CommandInput
                        placeholder="Search or create..."
                        value={search}
                        onValueChange={setSearch}
                        className="rounded-none text-sm"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        {filteredTags.length > 0 && (
                            <CommandGroup>
                                <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                                    Existing Tags
                                </div>
                                <div className="flex flex-wrap gap-2 p-3">
                                    {filteredTags.map((tag) => {
                                        const isSelected = selectedTagIds.includes(tag.id);
                                        
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleToggleTag(tag)}
                                                type="button"
                                            >
                                                <TagComponent color={tag.color} selected={isSelected}>
                                                    <TagLabel>{tag.name}</TagLabel>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </TagComponent>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CommandGroup>
                        )}

                        {filteredTags.length === 0 && !isNewTag && (
                            <div className="py-6 text-xs text-muted-foreground text-center">
                                No tags found.
                            </div>
                        )}
                        
                        {isNewTag && (
                            <CommandGroup className="border-t-2 border-border">
                                <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                                    Create New
                                </div>
                                <div className="p-3 space-y-4">
                                    {/* Preview */}
                                    <div className="flex items-center justify-center p-3 bg-card border border-border">
                                        <TagComponent color={selectedColor} selected>
                                            <TagLabel>{search}</TagLabel>
                                        </TagComponent>
                                    </div>
                                    
                                    {/* Color picker — Vignelli palette */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.keys(TAG_COLORS).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                type="button"
                                                className={cn(
                                                    "h-6 cursor-pointer transition-all border-2",
                                                    TAG_BG_COLORS[color as keyof typeof TAG_BG_COLORS],
                                                    selectedColor === color 
                                                        ? 'border-foreground' 
                                                        : 'border-transparent hover:border-muted-foreground'
                                                )}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Button
                                        onClick={handleCreateTag}
                                        className="w-full rounded-none text-[10px] font-semibold uppercase tracking-[0.15em]"
                                    >
                                        Create Tag
                                    </Button>
                                </div>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
