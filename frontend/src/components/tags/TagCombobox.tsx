import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Tag as TagComponent } from '@/components/tags/Tag';
import { type TagData } from '@/components/tags/types';

interface TagComboboxProps {
    availableTags: TagData[];
    selectedTagIds: number[];
    onAddTag: (tagId: number) => void;
    onRemoveTag: (tagId: number) => void;
}

export function TagCombobox({ availableTags, selectedTagIds, onAddTag, onRemoveTag }: TagComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredTags = availableTags.filter(
        (tag) => tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleTag = (tag: TagData) => {
        if (selectedTagIds.includes(tag.id)) {
            onRemoveTag(tag.id);
        } else {
            onAddTag(tag.id);
        }
        setSearch('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost">
                    Add Tag
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
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
                                    {tag.name}
                                    {isSelected && <Check className="size-3" />}
                                </TagComponent>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}