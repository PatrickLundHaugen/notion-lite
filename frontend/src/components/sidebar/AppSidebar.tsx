import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useParams, useLocation, Link } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type Active, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { TreeView } from '@/components/sidebar/TreeView';
import { TreeItem } from '@/components/sidebar/TreeItem';
import { SidebarTags } from '@/components/tags/SidebarTags';
import type { Page } from "@/components/editor/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
    pages: Page[];
    isLoading: boolean;
    onNewPage: (parentId?: number) => void;
    onMovePage: (pageId: number, parentId: number | null) => void;
    refreshKey?: number;
}

interface RenderPageProps {
    page: Page;
    onNewPage: (parentId?: number) => void;
    level: number;
    activeDrag?: Active | null;
}

const RenderPage = ({ page, onNewPage, level, activeDrag }: RenderPageProps) => {
    const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({ 
        id: `page-${page.id}`,
        data: { page }
    });
    
    const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ 
        id: `page-${page.id}`,
        data: { page }
    });

    const combinedRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        setDroppableNodeRef(node);
    };

    const isDragging = activeDrag?.data?.current?.page?.id === page.id;

    return (
        <TreeItem
            ref={combinedRef}
            item={page}
            level={level}
            isOver={isOver}
            href={`/pages/${page.slug}`}
            className={cn(isDragging && "opacity-50")}
            label={
                <div 
                    className="flex items-center w-full"
                    {...attributes}
                    {...listeners}
                >
                    <span className="truncate">{page.title}</span>
                </div>
            }
        >
            {page.children &&
                page.children.map((child) => (
                    <RenderPage
                        key={child.id}
                        page={child}
                        onNewPage={onNewPage}
                        level={level + 1}
                        activeDrag={activeDrag}
                    />
                ))}
        </TreeItem>
    );
};

const RootDropZone = () => {
    const { setNodeRef, isOver } = useDroppable({ 
        id: 'root',
        data: { isRoot: true }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex grow items-center justify-center text-sm text-muted-foreground transition-colors",
                isOver && "bg-accent"
            )}
        >
            <span className="text-xs text-center">Drop here to move to root</span>
        </div>
    );
};

const sortPagesAlphabetically = (pages: Page[]): Page[] => {
    return pages
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((page) => ({
            ...page,
            children: page.children ? sortPagesAlphabetically(page.children) : [],
        }));
};

export function AppSidebar({ pages, isLoading, onNewPage, onMovePage, refreshKey }: AppSidebarProps) {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const [activeDrag, setActiveDrag] = useState<Active | null>(null);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    const isDashboard = location.pathname === "/";

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Find the current page ID from the slug
    const currentPageId = useMemo(() => {
        if (!slug) return null;
        
        const findPageBySlug = (pages: Page[]): number | null => {
            for (const page of pages) {
                if (page.slug === slug) return page.id;
                if (page.children) {
                    const found = findPageBySlug(page.children);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return findPageBySlug(pages);
    }, [slug, pages]);

    // Filter pages by selected tags
    const filteredPages = useMemo(() => {
        if (selectedTagIds.length === 0) return pages;

        const filterPage = (page: Page): Page | null => {
            // Check if page has any of the selected tags
            const hasSelectedTag = page.tags?.some(tag => selectedTagIds.includes(tag.id));
            
            // Recursively filter children
            const filteredChildren = page.children
                ?.map(child => filterPage(child))
                .filter((child): child is Page => child !== null) || [];

            // Include page if it has a selected tag OR if any of its children match
            if (hasSelectedTag || filteredChildren.length > 0) {
                return {
                    ...page,
                    children: filteredChildren
                };
            }

            return null;
        };

        return pages
            .map(page => filterPage(page))
            .filter((page): page is Page => page !== null);
    }, [pages, selectedTagIds]);

    const sortedPages = useMemo(() => sortPagesAlphabetically(filteredPages), [filteredPages]);

    const flattenedPages = useMemo(() => {
        const flatten = (pages: Page[], parentId: number | null = null): Page[] => {
            return pages.reduce((acc, page) => {
                acc.push({ ...page, parent_id: parentId });
                if (page.children) {
                    acc.push(...flatten(page.children, page.id));
                }
                return acc;
            }, [] as Page[]);
        };
        return flatten(pages);
    }, [pages]);

    const activePage = useMemo(() => 
        flattenedPages.find(p => p.id === activeDrag?.data?.current?.page?.id), 
        [activeDrag, flattenedPages]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDrag(null);
    
        if (!active || !over || active.id === over.id) {
            return;
        }
    
        const activePage = active.data?.current?.page as Page | undefined;
        if (!activePage) {
            return;
        }
    
        const overId = over.id;
    
        if (overId === 'root') {
            onMovePage(activePage.id, null);
            return;
        }
    
        const overIdStr = String(overId);
        if (overIdStr.startsWith('page-')) {
            const targetPageId = parseInt(overIdStr.replace('page-', ''));
            const overPage = flattenedPages.find(p => p.id === targetPageId);
            
            if (!overPage || activePage.id === overPage.id) {
                return;
            }
            
            const isDescendant = (pageId: number, ancestorId: number): boolean => {
                const page = flattenedPages.find(p => p.id === pageId);
                if (!page || page.parent_id === null) return false;
                if (page.parent_id === ancestorId) return true;
                return isDescendant(page.parent_id, ancestorId);
            };

            if (isDescendant(targetPageId, activePage.id)) {
                return;
            }
            
            onMovePage(activePage.id, overPage.id);
        }
    };

    return (
        <Sidebar collapsible="offcanvas">
            <SidebarContent>
                {/* Dashboard Section */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isDashboard}>
                                <Link to="/">
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="h-full">
                    <div className="flex items-center justify-between">
                        <SidebarGroupLabel className="p-2">
                            Notes
                        </SidebarGroupLabel>
                        <Button variant="ghost" size="icon" onClick={() => onNewPage()}>
                            <Plus size={14} />
                        </Button>
                    </div>
                    <SidebarGroupContent className="flex flex-col h-full">
                        {isLoading ? (
                            <SidebarMenu>
                                <SidebarMenuItem>Loading...</SidebarMenuItem>
                            </SidebarMenu>
                        ) : pages.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                onDragStart={({ active }) => setActiveDrag(active)}
                                onDragEnd={handleDragEnd}
                                onDragCancel={() => setActiveDrag(null)}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <div className="flex flex-col gap-2 h-full">
                                    <div>
                                        {sortedPages.length > 0 ? (
                                            <TreeView
                                                data={sortedPages}
                                                currentId={currentPageId}
                                                renderItem={(page) => (
                                                    <RenderPage page={page} onNewPage={onNewPage} level={0} activeDrag={activeDrag} />
                                                )}
                                            />
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No notes match the selected tags
                                            </div>
                                        )}
                                    </div>
                                    <RootDropZone />
                                </div>
                                <DragOverlay>
                                    {activePage ? (
                                        <div className="px-3 py-1.5 bg-accent border shadow-sm text-sm">
                                            <span className="truncate">{activePage.title}</span>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        ) : (
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <span className="text-muted-foreground text-sm p-2">
                                        You have no notes
                                    </span>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarTags 
                    pages={pages}
                    selectedTagIds={selectedTagIds}
                    onTagsChange={setSelectedTagIds}
                    refreshKey={refreshKey}
                />
            </SidebarContent>
        </Sidebar>
    );
}