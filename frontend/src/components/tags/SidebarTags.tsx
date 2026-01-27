import { useEffect, useState, useMemo } from 'react';
import { TagIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { getTagsOfflineAware } from '@/lib/offline-helpers';
import { Tag, TagLabel } from '@/components/tags/Tag';
import { type TagData } from '@/components/tags/types';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
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
            // Use offline-aware fetching
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

    // Calculate tag counts from pages
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

    // Sort tags by count
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

    const clearFilters = () => {
        onTagsChange([]);
    };

    if (isLoading) {
        return (
            <SidebarGroup>
                <div className="flex items-center justify-between px-2 py-3">
                    <SidebarGroupLabel className="gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground p-0">
                        <TagIcon className="w-3 h-3" />
                        Tags
                    </SidebarGroupLabel>
                </div>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem className="px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                            Loading...
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (allTags.length === 0) {
        return (
            <SidebarGroup>
                <div className="flex items-center justify-between px-2 py-3">
                    <SidebarGroupLabel className="gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground p-0">
                        <TagIcon className="w-3 h-3" />
                        Tags
                    </SidebarGroupLabel>
                </div>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem className="px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                            No tags yet
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-3">
                <SidebarGroupLabel className="gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground p-0">
                    <TagIcon className="w-3 h-3" /> 
                    Tags
                </SidebarGroupLabel>
                {selectedTagIds.length > 0 && (
                    <Button 
                        variant="ghost" 
                        onClick={clearFilters} 
                        className="rounded-none h-5 px-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
                    >
                        Clear
                    </Button>
                )}
            </div>
            <SidebarGroupContent>
                <div className="flex flex-wrap gap-2 p-3">
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
                                <TagLabel>{tag.name}</TagLabel>
                                <span className="opacity-70">{count}</span>
                            </Tag>
                        );
                    })}
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}