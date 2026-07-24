import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { getTagsOfflineAware } from '@/lib/offline-helpers';
import { Tag } from '@/components/tags/Tag';
import { type TagData } from '@/components/tags/types';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import type { Page } from '@/components/editor/types';

interface SidebarTagsProps {
    pages: Page[];
    selectedTagIds: number[];
    onTagsChange: (tagIds: number[]) => void;
    refreshKey?: number;
}

export function SidebarTags({ pages, selectedTagIds, onTagsChange }: SidebarTagsProps) {
    const [allTags, setAllTags] = useState<TagData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const tags = await getTagsOfflineAware(async () => {
                return await api.get('/tags') as TagData[];
            });
            setAllTags(tags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const tagCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        const countTagsInPage = (page: Page) => {
            page.tags?.forEach((tag) => {
                counts[tag.id] = (counts[tag.id] || 0) + 1;
            });
            page.children?.forEach(countTagsInPage);
        };
        pages.forEach(countTagsInPage);
        return counts;
    }, [pages]);

    const sortedTags = useMemo(() => {
        return [...allTags].sort((a, b) => {
            const countA = tagCounts[a.id] || 0;
            const countB = tagCounts[b.id] || 0;
            return countB - countA;
        });
    }, [allTags, tagCounts]);

    const toggleTag = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            onTagsChange(selectedTagIds.filter((id) => id !== tagId));
        } else {
            onTagsChange([...selectedTagIds, tagId]);
        }
    };

    const clearFilters = () => onTagsChange([]);

    return (
        <SidebarGroup>
            <div className="flex items-center justify-between">
                <SidebarGroupLabel>Tags</SidebarGroupLabel>
                {selectedTagIds.length > 0 && !isLoading && (
                    <Button variant="ghost" onClick={clearFilters}>
                        Clear
                    </Button>
                )}
            </div>
            <SidebarGroupContent>
                {isLoading ? (
                    <span className="px-2 text-sm font-medium text-muted-foreground">
                        Loading...
                    </span>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {sortedTags.map((tag) => {
                            const count = tagCounts[tag.id] || 0;
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                                <Tag
                                    key={tag.id}
                                    color={tag.color}
                                    selected={isSelected}
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    {tag.name}
                                    <span>{count}</span>
                                </Tag>
                            );
                        })}
                    </div>
                )}
            </SidebarGroupContent>
        </SidebarGroup>
    );
}