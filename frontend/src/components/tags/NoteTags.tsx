import { useState, useEffect } from 'react';
import { Tag, TagLabel } from '@/components/tags/Tag';
import { TagEditMenu } from '@/components/tags/TagEditMenu';
import { TagCombobox } from '@/components/tags/TagCombobox';
import { type TagData } from '@/components/tags/types';
import { api } from '@/lib/api';

interface NoteTagsProps {
    pageId: number;
    tags: TagData[];
    onTagsChange: (tags: TagData[]) => void;
    onTagsUpdated?: () => void;
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

    const handleAddTag = async (tagName: string, color: string) => {
        try {
            const existingTag = allTags.find(
                (t) => t.name.toLowerCase() === tagName.toLowerCase()
            );

            const response = await api.post(`/pages/${pageId}/tags`, {
                tag_name: tagName,
                tag_color: color,
            });

            onTagsChange(response.tags);

            if (!existingTag) {
                const newTag = response.tags.find(
                    (t: TagData) => t.name.toLowerCase() === tagName.toLowerCase()
                );
                if (newTag) {
                    setAllTags((prev) => [...prev, newTag]);
                }
            }
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

    const handleChangeColor = async (tagId: number, color: string) => {
        try {
            await api.put(`/tags/${tagId}`, { color });

            setAllTags((prev) =>
                prev.map((tag) => (tag.id === tagId ? { ...tag, color } : tag))
            );
            onTagsChange(
                tags.map((tag) => (tag.id === tagId ? { ...tag, color } : tag))
            );
        } catch (error) {
            console.error('Failed to change tag color:', error);
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        try {
            await api.delete(`/tags/${tagId}`);
            setAllTags((prev) => prev.filter((tag) => tag.id !== tagId));
            onTagsChange(tags.filter((tag) => tag.id !== tagId));
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Loading tags...</div>;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
                <TagEditMenu
                    key={tag.id}
                    tagId={tag.id}
                    currentColor={tag.color}
                    onRemove={handleRemoveTag}
                    onChangeColor={handleChangeColor}
                    onDelete={handleDeleteTag}
                >
                    <Tag color={tag.color}>
                        <TagLabel>{tag.name}</TagLabel>
                    </Tag>
                </TagEditMenu>
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