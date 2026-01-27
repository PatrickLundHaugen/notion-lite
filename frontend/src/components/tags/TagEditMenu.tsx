import { useState, useEffect } from 'react';
import { Trash2, Palette, CircleMinus } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TAG_COLORS, TAG_BG_COLORS } from '@/components/tags/Tag';

interface TagEditMenuProps {
    tagId: number;
    currentColor: string;
    onChangeColor?: (tagId: number, color: string) => void;
    onRemove?: (tagId: number) => void;
    onDelete?: (tagId: number) => void;
    children: React.ReactNode;
}

export function TagEditMenu({ 
    tagId, 
    currentColor, 
    onChangeColor, 
    onRemove, 
    onDelete,
    children 
}: TagEditMenuProps) {
    const [open, setOpen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        
        if (!open) {
            timeoutId = setTimeout(() => {
                setShowColorPicker(false);
            }, 300);
        }
        
        return () => clearTimeout(timeoutId);
    }, [open]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>

            <DropdownMenuContent 
                align="start" 
                onClick={(e) => e.stopPropagation()}
                className="rounded-none border-2 border-border min-w-[160px]"
            >
                {showColorPicker ? (
                    <div className="p-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                            Select Color
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(TAG_COLORS).map((color) => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        onChangeColor?.(tagId, color);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "h-6 cursor-pointer transition-all border-2",
                                        TAG_BG_COLORS[color as keyof typeof TAG_BG_COLORS], 
                                        color === currentColor 
                                            ? "border-foreground" 
                                            : "border-transparent hover:border-muted-foreground"
                                    )}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {onChangeColor && (
                            <DropdownMenuItem 
                                onClick={(e) => { e.preventDefault(); setShowColorPicker(true) }}
                                className="rounded-none text-xs cursor-pointer"
                            >
                                <Palette /> Change Color
                            </DropdownMenuItem>
                        )}
                        {onRemove && (
                            <DropdownMenuItem 
                                onClick={() => { onRemove(tagId); setOpen(false) }}
                                className="rounded-none text-xs cursor-pointer"
                            >
                                <CircleMinus /> Remove from Note
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem 
                                onClick={() => { onDelete(tagId); setOpen(false) }} 
                                className="rounded-none text-xs cursor-pointer text-destructive focus:text-destructive"
                            >
                                <Trash2 /> Delete Tag
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
