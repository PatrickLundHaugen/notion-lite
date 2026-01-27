import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/lib/api";
import type { Page } from "@/components/notes/types";

export type PageContextType = {
  pages: Page[];
  isLoading: boolean;
  error: string | null;
  refreshPages: () => void;
  addPage: (parentId?: number) => void;
  movePage: (pageId: number, parentId: number | null) => void;
  sidebarRefreshKey: number;
  refreshSidebar: () => void;
};

export function usePages() {
  return useOutletContext<PageContextType>();
}

export function usePagesState() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const fetchPages = useCallback(async () => {
    try {
      setError(null);
      const rawPages = (await api.get("/pages")) as Page[];
      setPages(rawPages.map(p => ({ ...p, title: p.title || "Untitled" })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPage = async (parentId?: number) => {
    try {
      await api.post("/pages", {
        title: "Untitled",
        content: "",
        parent_id: parentId,
      });
      await fetchPages();
    } catch (err) {
      console.error(err);
    }
  };

  const movePage = async (pageId: number, parentId: number | null) => {
    try {
      await api.patch(`/pages/${pageId}/move`, { parent_id: parentId });
      await fetchPages();
    } catch (err) {
      console.error(err);
    }
  };

  const refreshSidebar = useCallback(() => {
    setSidebarRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  return { 
    pages, 
    isLoading, 
    error, 
    refreshPages: fetchPages, 
    addPage, 
    movePage,
    sidebarRefreshKey,
    refreshSidebar
  };
} 