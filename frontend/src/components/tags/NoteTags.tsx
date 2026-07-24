import { useState, useEffect } from 'react';
import { Tag } from '@/components/tags/Tag';
import { TagCombobox } from '@/components/tags/TagCombobox';
import { type TagData } from '@/components/tags/types';
import { api } from '@/lib/api';

interface NoteTagsProps {
    pageId: number;
    tags: TagData[];
    onTagsChange: (tags: TagData[]) => void;
}

export function NoteTags({ pageId, tags, onTagsChange }: NoteTagsProps) {
    const [allTags, setAllTags] = useState<TagData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAllTags();
    }, []);

    const loadAllTags = async () => {
        try {
            const tags = await api.get('/tags');
            setAllTags(tags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTag = async (tagId: number) => {
        try {
            const response = await api.post(`/pages/${pageId}/tags`, {
                tag_id: tagId,
            });
            onTagsChange(response.tags);
        } catch (error) {
            console.error('Failed to add tag:', error);
        }
    };

    const handleRemoveTag = async (tagId: number) => {
        try {
            const response = await api.delete(`/pages/${pageId}/tags/${tagId}`);
            onTagsChange(response.tags);
        } catch (error) {
            console.error('Failed to remove tag:', error);
        }
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Loading tags...</div>;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
                <Tag key={tag.id} color={tag.color}>
                    {tag.name}
                </Tag>
            ))}

            <TagCombobox
                availableTags={allTags}
                selectedTagIds={tags.map((t) => t.id)}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
            />
        </div>
    );
}