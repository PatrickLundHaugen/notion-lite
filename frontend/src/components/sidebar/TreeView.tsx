import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type TreeViewContextProps = {
    expandedIds: Set<string | number>;
    toggleExpanded: (id: string | number) => void;
    selectedId: string | number | null;
    selectId: (id: string | number | null) => void;
    currentId: string | number | null;
};

const TreeViewContext = createContext<TreeViewContextProps | null>(null);

export const useTreeView = () => {
    const context = useContext(TreeViewContext);
    if (!context) throw new Error('useTreeView must be used within a TreeViewProvider');
    return context;
};

interface TreeViewProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    data: T[];
    renderItem: (item: T) => React.ReactNode;
    defaultExpandedIds?: Set<string | number>;
    currentId?: string | number | null;
    getItemId?: (item: T) => string | number;
    getItemChildren?: (item: T) => T[] | undefined;
}

// Helper to find the path to an item (returns array of ancestor IDs)
function findPathToItem<T>(
    items: T[],
    targetId: string | number,
    getId: (item: T) => string | number,
    getChildren: (item: T) => T[] | undefined,
    currentPath: (string | number)[] = []
): (string | number)[] | null {
    for (const item of items) {
        const itemId = getId(item);
        if (itemId === targetId) {
            return currentPath;
        }
        const children = getChildren(item);
        if (children && children.length > 0) {
            const found = findPathToItem(
                children,
                targetId,
                getId,
                getChildren,
                [...currentPath, itemId]
            );
            if (found) return found;
        }
    }
    return null;
}

export const TreeView = <T extends { id: string | number }>({
    data,
    renderItem,
    className,
    defaultExpandedIds,
    currentId,
    getItemId = (item) => item.id,
    getItemChildren = (item) => (item as any).children,
    ...props
}: TreeViewProps<T>) => {
    const [expandedIds, setExpandedIds] = useState<Set<string | number>>(
        defaultExpandedIds || new Set()
    );
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [lastExpandedForId, setLastExpandedForId] = useState<string | number | null>(null);

    // Auto-expand path to current item and sync selection state
    useEffect(() => {
        // Clear selection when navigating away (e.g., to dashboard)
        if (currentId == null) {
            setSelectedId(null);
            return;
        }
        
        if (currentId !== lastExpandedForId) {
            const path = findPathToItem(data, currentId, getItemId, getItemChildren);
            if (path && path.length > 0) {
                setExpandedIds(prev => {
                    const next = new Set(prev);
                    path.forEach(id => next.add(id));
                    return next;
                });
            }
            setSelectedId(currentId);
            setLastExpandedForId(currentId);
        }
    }, [currentId, data, getItemId, getItemChildren, lastExpandedForId]);

    const toggleExpanded = useCallback((id: string | number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const selectId = useCallback((id: string | number | null) => {
        setSelectedId(id);
    }, []);

    const contextValue = useMemo(() => ({
        expandedIds,
        toggleExpanded,
        selectedId,
        selectId,
        currentId: currentId ?? null,
    }), [expandedIds, toggleExpanded, selectedId, selectId, currentId]);

    return (
        <TreeViewContext.Provider value={contextValue}>
            <div className={cn(className)} {...props}>
                {data.map(item => (
                <React.Fragment key={getItemId(item)}>{renderItem(item)}</React.Fragment>
                ))}
            </div>
        </TreeViewContext.Provider>
    );
};