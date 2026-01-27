import SidebarLayout from "@/components/layouts/SidebarLayout";
import { Outlet } from "react-router-dom";
import { usePagesState, type PageContextType } from "./usePages";

export default function PagesLayoutProvider() {
    const pagesState = usePagesState();

    return (
        <SidebarLayout
            pages={pagesState.pages}
            isLoading={pagesState.isLoading}
            onNewPage={pagesState.addPage}
            onMovePage={pagesState.movePage}
            refreshKey={pagesState.sidebarRefreshKey}
        >
            <Outlet context={pagesState as PageContextType} />
        </SidebarLayout>
    );
}