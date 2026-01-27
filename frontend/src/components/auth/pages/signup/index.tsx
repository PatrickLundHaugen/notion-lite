import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle } from "lucide-react";

import { api } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.post('/users', { username, password });
            alert('Signup successful! Please log in.');
            navigate('/login');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Sign Up
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create an account to start taking notes
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
                            <p className="text-sm text-muted-foreground">Creating account...</p>
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

                    <div className="space-y-2">
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
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="underline hover:text-foreground transition-colors">
                        Log In
                    </Link>
                </p>
            </div>
        </main>
    );
}
