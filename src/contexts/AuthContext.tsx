import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: 'farmer' | 'buyer' | 'admin';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signInWithGoogle: () => void;
    signInWithGithub: () => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('http://localhost:3001/api/auth/me', {
                signal: controller.signal,
                credentials: 'omit' // Fallback to local cookie via direct API if possible, but actually we need credentials: 'include'. However, for localhost 8080 to 3001, we might need true if we are using cookies.
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                // Not returning anything if not logged in
                return;
            }

            const data = await res.json();
            if (data.user) {
                setUser({
                    id: data.user.id || data.user.uid,
                    name: data.user.name || 'User',
                    email: data.user.email || '',
                    avatar: data.user.picture || data.user.avatar,
                    role: data.user.role || 'farmer',
                });
            }
        } catch (error) {
            console.error("Backend session check failed:", error);
        }
    };

    // Attempt backend session authentication check on mount
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            try {
                // If there's a token cookie (frontend needs credentials: "include" for this to work cross-origin if configured, but let's just do a basic fetch)
                const res = await fetch('http://localhost:3001/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser({
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            avatar: data.user.picture,
                            role: data.user.role || 'farmer',
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch session from backend", err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const signInWithGoogle = () => {
        // Direct redirect to backend server's Google OAuth flow
        window.location.href = 'http://localhost:3001/api/auth/google';
    };

    const signInWithGithub = () => {
        // Direct redirect to backend server's GitHub OAuth flow
        window.location.href = 'http://localhost:3001/api/auth/github';
    };

    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/auth/logout', { method: 'POST' });
            setUser(null);
            toast.success('Successfully logged out');
            window.location.href = '/login';
        } catch (error) {
            console.error("Error logging out", error);
            toast.error("Failed to log out properly.");
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signInWithGoogle,
                signInWithGithub,
                logout,
                checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
