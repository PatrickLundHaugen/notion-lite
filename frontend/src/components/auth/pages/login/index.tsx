import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/context/useAuth';
import { Loader2, AlertCircle } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const data = await api.login(formData);
            login(data.access_token); 
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Log In
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access your notes
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-3 p-4 border border-destructive bg-destructive/5">
                            <AlertCircle className="size-4 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="flex items-center gap-3 p-4 border bg-card">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Signing in...</p>
                        </div>
                    )}

                    <div>
                        <label 
                            htmlFor="username"
                            className="text-sm font-medium"
                        >
                            Username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full mt-2"
                        />
                    </div>

                    <div>
                        <label 
                            htmlFor="password"
                            className="text-sm font-medium"
                        >
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full mt-2"
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full"
                    >
                        {isLoading ? 'Signing In...' : 'Log In'}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="underline hover:text-foreground transition-colors">
                        Sign Up
                    </Link>
                </p>
            </div>
        </main>
    );
}
