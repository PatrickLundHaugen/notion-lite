import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import type { Page } from '@/components/editor/types';
import { Button } from "@/components/ui/button";
import { OnlineIndicator } from "@/components/ui/OnlineIndicator.tsx";
import { AIStatusIndicator } from "@/components/settings";

type PageContextType = {
    pages: Page[];
    isLoading: boolean;
    error: string | null;
};

function flattenPages(pages: Page[]): Page[] {
    return pages.reduce<Page[]>((acc, page) => {
        acc.push(page);
        if (page.children?.length) {
            acc.push(...flattenPages(page.children));
        }
        return acc;
    }, []);
}

export default function Dashboard() {
    const { pages, isLoading, error } = useOutletContext<PageContextType>();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Loading...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">
                    Error: {error}
                </p>
            </div>
        );
    }

    const allPages = flattenPages(pages);
    const recentPages = [...allPages]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 6);

    const TAG_COLOR_CLASS: Record<string, string> = {
        red: 'bg-tag-red',
        orange: 'bg-tag-orange',
        yellow: 'bg-tag-yellow',
        green: 'bg-tag-green',
        blue: 'bg-tag-blue',
        purple: 'bg-tag-purple',
        cyan: 'bg-tag-cyan',
        fuchsia: 'bg-tag-fuchsia',
    };

    return (
        <div className="grid grid-cols-6 md:grid-cols-12 flex-1 mt-4">
            <div className="col-span-3 md:col-span-6 flex flex-col justify-between">
                <div className="grid grid-cols-6 px-6">
                    <h2 className="col-start-1 col-end-6 text-sm font-medium mb-4">
                        Recent Notes
                    </h2>

                    {recentPages.length > 0 ? (
                        <div className="grid col-span-6 gap-y-4">
                            {recentPages.slice(0, 4).map((page) => (
                                <Link
                                    key={page.id}
                                    to={`/pages/${page.slug}`}
                                    className="group flex flex-col"
                                >
                                    {page.tags && page.tags.length > 0 && (
                                        <div className="flex flex-wrap">
                                            {page.tags.map((tag, index) => (
                                                <div
                                                    key={`${page.id}-tag-${index}`}
                                                    className={`size-4 ${TAG_COLOR_CLASS[tag.color] ?? TAG_COLOR_CLASS.fuchsia}`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-base font-semibold group-hover:underline">
                                            {page.title || 'Untitled'}
                                        </h3>

                                        <p className="text-xs font-medium text-muted-foreground">
                                            {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-6 border-2 border-dashed border-border p-12 text-center">
                            <p className="text-muted-foreground mb-4">No notes yet</p>
                            <Button>
                                Create Your First Note
                            </Button>
                        </div>
                    )}
                </div>
                <h1 className="text-[clamp(4rem,10vw,8rem)] font-bold tracking-tighter sm:whitespace-nowrap">
                    Pat's Notes
                </h1>
            </div>

            <div className="col-start-9 col-end-13 px-6">
                <h2 className="text-sm font-medium mb-4">Transit map</h2>
                {Object.entries(TAG_COLOR_CLASS).map(([name, className]) => (
                    <div
                        key={name}
                        className={`grid place-items-center py-6 ${className} font-bold capitalize`}
                    >
                        <p>{name}</p>
                    </div>
                ))}
                <div>
                    <OnlineIndicator showLabel={true} />
                    <AIStatusIndicator />
                </div>
            </div>
        </div>
    );
}
