import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/context/useAuth";
import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import ModeToggle from "@/components/theme/ModeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false)

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            setOpen((open) => !open)
        }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <header className="grid grid-cols-6 md:grid-cols-12 items-center border-b">
            <div className="flex justify-self-start col-start-1">
                <SidebarTrigger />
            </div>

            <div className="flex justify-self-start col-start-2 md:col-start-9">
                <Button
                    variant="ghost"
                    onClick={() => setOpen(true)}
                >
                    Find...
                </Button>

                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            <CommandItem>Calendar</CommandItem>
                            <CommandItem>Search Notes</CommandItem>
                            <CommandItem>Settings</CommandItem>
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>
            </div>

            <div className="col-start-4 md:col-start-11">
                <ModeToggle />
            </div>


            <div className="flex justify-self-end col-start-5 col-end-7 md:col-start-12 md:col-end-auto">
                {token ? (
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                    >
                        Logout
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button asChild variant="ghost">
                            <NavLink to="/login">Log In</NavLink>
                        </Button>
                        <Button asChild>
                            <NavLink to="/signup">Sign Up</NavLink>
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}