import * as React from "react";
import { cn } from "@/lib/utils";

export const TAG_COLORS = {
    red:    'border-tag-red text-tag-red hover:bg-tag-red hover:text-white',
    orange: 'border-tag-orange text-tag-orange hover:bg-tag-orange hover:text-white',
    yellow: 'border-tag-yellow text-tag-yellow hover:bg-tag-yellow hover:text-stone-900',
    green:  'border-tag-green text-tag-green hover:bg-tag-green hover:text-white',
    blue:   'border-tag-blue text-tag-blue hover:bg-tag-blue hover:text-white',
    purple: 'border-tag-purple text-tag-purple hover:bg-tag-purple hover:text-white',
    cyan:   'border-tag-cyan text-tag-cyan hover:bg-tag-cyan hover:text-white',
    fuchsia:  'border-tag-fuchsia text-tag-fuchsia hover:bg-tag-fuchsia hover:text-white',
};

export const TAG_SOLID_COLORS = {
    red:    'bg-tag-red text-white',
    orange: 'bg-tag-orange text-white',
    yellow: 'bg-tag-yellow text-stone-900',
    green:  'bg-tag-green text-white',
    blue:   'bg-tag-blue text-white',
    purple: 'bg-tag-purple text-white',
    cyan:   'bg-tag-cyan text-white',
    fuchsia:  'bg-tag-fuchsia text-white',
};

export const TAG_BG_COLORS = {
    red:    'bg-tag-red',
    orange: 'bg-tag-orange',
    yellow: 'bg-tag-yellow',
    green:  'bg-tag-green',
    blue:   'bg-tag-blue',
    purple: 'bg-tag-purple',
    cyan:   'bg-tag-cyan',
    fuchsia:  'bg-tag-fuchsia',
};

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: string;
    selected?: boolean;
}

export function Tag({ color, selected, className, children, ...props }: TagProps) {
    const safeColor = (color && color in TAG_COLORS) ? (color as keyof typeof TAG_COLORS) : 'fuchsia';
    
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 cursor-pointer transition-all",
                "text-[10px] font-semibold uppercase",
                "border-2",
                selected ? TAG_SOLID_COLORS[safeColor] : TAG_COLORS[safeColor],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export function TagLabel({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <span className={cn("truncate", className)}>
            {children}
        </span>
    );
}
