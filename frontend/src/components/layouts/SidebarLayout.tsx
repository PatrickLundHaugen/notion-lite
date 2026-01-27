import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import type { Page } from "@/components/editor/types";

interface SidebarLayoutProps {
  children: ReactNode;
  pages: Page[];
  isLoading: boolean;
  onNewPage: (parentId?: number) => void;
  onMovePage: (pageId: number, parentId: number | null) => void;
  refreshKey?: number;
}

export default function SidebarLayout({ 
    children, 
    pages, 
    isLoading, 
    onNewPage, 
    onMovePage,
    refreshKey 
}: SidebarLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar
                pages={pages}
                isLoading={isLoading}
                onNewPage={onNewPage}
                onMovePage={onMovePage}
                refreshKey={refreshKey}
            />
            <SidebarInset>
                <Header />
                    {children}
                <Footer />
            </SidebarInset>
        </SidebarProvider>
    );
}