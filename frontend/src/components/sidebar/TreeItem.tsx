import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreeView } from "@/components/sidebar/TreeView";
import {Button} from "@/components/ui/button.tsx";

interface TreeItemProps extends React.HTMLAttributes<HTMLDivElement> {
  item: { id: string | number; children?: any[] };
  label: React.ReactNode;
  href?: string;
  level?: number;
  isOver?: boolean;
}

export const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
    ({ item, label, href, children, className, level = 0, isOver, ...props }, ref) => {
        const { expandedIds, toggleExpanded, selectId, selectedId, currentId } = useTreeView();
        const isExpanded = expandedIds.has(item.id);
        const hasChildren = React.Children.count(children) > 0;
        const isCurrent = currentId === item.id;

        const handleToggle = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (hasChildren) toggleExpanded(item.id);
        };

        const handleSelect = () => selectId(item.id);

        const rowContent = (
            <>
                <button
                    onClick={handleToggle}
                    className={cn(
                        "flex items-center justify-center size-4 flex-shrink-0 transition-colors",
                        isCurrent 
                            ? "text-primary-foreground/70 hover:text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <div />
                    )}
                </button>

                <div className="flex-1 py-0.5 truncate">{label}</div>
            </>
        );

        return (
            <div
                ref={ref}
                className={cn(
                    "w-full",
                    isOver && "bg-accent/50",
                    className
                )}
                {...props}
            >
                <Button
                    asChild
                    variant="ghost"
                    className={cn(
                        "w-full justify-start",
                        isCurrent && "bg-border",
                        !isCurrent && selectedId === item.id && "bg-accent"
                    )}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={handleSelect}
                >
                    {href ? (
                        <a href={href}>
                            {rowContent}
                        </a>
                    ) : (
                        <div>
                            {rowContent}
                        </div>
                    )}
                </Button>

                {isExpanded && hasChildren && (
                    <div className="relative">
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-border"
                            style={{ left: `${level * 16 + 16}px` }}
                        />
                        {children}
                    </div>
                )}
            </div>
        );
    }
);

TreeItem.displayName = "TreeItem";