import * as React from "react";
import { cn } from "@/lib/utils";

export const TAG_COLORS = {
    red:    "bg-tag-red hover:opacity-80",
    orange: "bg-tag-orange hover:opacity-80",
    yellow: "bg-tag-yellow hover:opacity-80",
    green:  "bg-tag-green hover:opacity-80",
    blue:   "bg-tag-blue hover:opacity-80",
    purple: "bg-tag-purple hover:opacity-80",
    cyan:   "bg-tag-cyan hover:opacity-80",
    fuchsia:  "bg-tag-fuchsia hover:opacity-80",
};

export const TAG_SOLID_COLORS = {
    red:    "bg-tag-red",
    orange: "bg-tag-orange",
    yellow: "bg-tag-yellow",
    green:  "bg-tag-green",
    blue:   "bg-tag-blue",
    purple: "bg-tag-purple",
    cyan:   "bg-tag-cyan",
    fuchsia:  "bg-tag-fuchsia",
};

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: string;
    selected?: boolean;
}

export function Tag({ color, selected, className, children, ...props }: TagProps) {
    const safeColor = (color && color in TAG_COLORS) ? (color as keyof typeof TAG_COLORS) : "fuchsia";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 cursor-pointer transition-colors select-none",
                "text-xs font-medium",
                selected ? TAG_SOLID_COLORS[safeColor] : TAG_COLORS[safeColor],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}