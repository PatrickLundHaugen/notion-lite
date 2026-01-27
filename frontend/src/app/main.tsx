import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@/app/index.css";
import App from "@/app/App";
import { AuthProvider } from "@/components/auth/context/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { OfflineBanner } from "@/components/ui/OnlineIndicator";

// Note: Sync service will be initialized when user is authenticated
// Do NOT call syncService.initialSync() here - it will fail without auth

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="light" storageKey="notion-lite-theme">
            <AuthProvider>
                <BrowserRouter>
                    <App />
                    <PWAUpdatePrompt />
                    <OfflineBanner />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>
);