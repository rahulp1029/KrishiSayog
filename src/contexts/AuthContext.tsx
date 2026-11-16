import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import {
    auth,
    googleProvider,
    githubProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
} from '@/lib/firebase';

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
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    loginAsDemo: () => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'krishisayog_user_session';

/** Detect mobile / tablet — popups are blocked on most mobile browsers */
function isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** Convert a Firebase user object to our internal User type */
function toAppUser(firebaseUser: any): User {
    return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Farmer',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || undefined,
        role: 'farmer',
    };
}

/** Map Firebase error codes to human-readable messages */
function friendlyError(code: string): string {
    switch (code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in cancelled. Please try again.';
        case 'auth/popup-blocked':
            return 'Popup blocked by browser. Retrying with redirect…';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized in Firebase. Contact support.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with a different sign-in method.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many sign-in attempts. Please wait a moment and try again.';
        default:
            return 'Sign-in failed. Please try again.';
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true); // Start true so redirect result can be checked

    const saveUserSession = (userData: User) => {
        setUser(userData);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    };

    // ── On mount: handle redirect result + subscribe to auth state ──────────
    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        // 1. Check if we just came back from a redirect sign-in
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    const userData = toAppUser(result.user);
                    saveUserSession(userData);
                    toast.success(`Welcome, ${userData.name}! 🌱`);
                    window.location.href = '/dashboard';
                }
            })
            .catch((error) => {
                // Redirect result errors are non-fatal (e.g. user closed window)
                console.warn('Redirect result error (non-fatal):', error.code);
            })
            .finally(() => {
                // 2. Subscribe to Firebase auth state changes
                const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                    if (firebaseUser) {
                        const userData = toAppUser(firebaseUser);
                        saveUserSession(userData);
                    } else {
                        // User is signed out from Firebase — clear local session
                        setUser(null);
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }
                    setIsLoading(false);
                });
                return unsubscribe;
            });
    }, []);

    const checkAuth = async () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            setUser(JSON.parse(saved));
        }
    };

    // ── Google Sign-In ───────────────────────────────────────────────────────
    const signInWithGoogle = async () => {
        if (!auth || !googleProvider) {
            toast.error('Firebase Auth is not initialized. Check your configuration.');
            return;
        }
        setIsLoading(true);
        try {
            if (isMobileDevice()) {
                // Mobile: use redirect (no popup support)
                toast.info('Redirecting to Google sign-in…');
                await signInWithRedirect(auth, googleProvider);
                // Page will reload — result handled in useEffect above
                return;
            }
            // Desktop: try popup first
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                const userData = toAppUser(result.user);
                saveUserSession(userData);
                toast.success(`Welcome, ${userData.name}! 🌱`);
                window.location.href = '/dashboard';
            }
        } catch (error: any) {
            const code = error?.code || '';
            if (code === 'auth/popup-blocked') {
                // Popup blocked on desktop — fall back to redirect
                try {
                    toast.info('Popup blocked. Redirecting to Google sign-in…');
                    await signInWithRedirect(auth, googleProvider);
                } catch (redirectErr: any) {
                    toast.error(friendlyError(redirectErr?.code || ''));
                    setIsLoading(false);
                }
            } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                toast.info(friendlyError(code));
                setIsLoading(false);
            } else {
                console.error('Google Sign-In Error:', error);
                toast.error(friendlyError(code));
                setIsLoading(false);
            }
        }
    };

    // ── GitHub Sign-In ───────────────────────────────────────────────────────
    const signInWithGithub = async () => {
        if (!auth || !githubProvider) {
            toast.error('Firebase Auth is not initialized. Check your configuration.');
            return;
        }
        setIsLoading(true);
        try {
            if (isMobileDevice()) {
                toast.info('Redirecting to GitHub sign-in…');
                await signInWithRedirect(auth, githubProvider);
                return;
            }
            const result = await signInWithPopup(auth, githubProvider);
            if (result.user) {
                const userData = toAppUser(result.user);
                saveUserSession(userData);
                toast.success(`Welcome, ${userData.name}! 🌱`);
                window.location.href = '/dashboard';
            }
        } catch (error: any) {
            const code = error?.code || '';
            if (code === 'auth/popup-blocked') {
                try {
                    toast.info('Popup blocked. Redirecting to GitHub sign-in…');
                    await signInWithRedirect(auth, githubProvider);
                } catch (redirectErr: any) {
                    toast.error(friendlyError(redirectErr?.code || ''));
                    setIsLoading(false);
                }
            } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                toast.info(friendlyError(code));
                setIsLoading(false);
            } else {
                console.error('GitHub Sign-In Error:', error);
                toast.error(friendlyError(code));
                setIsLoading(false);
            }
        }
    };

    // ── Demo Login (no Firebase) ─────────────────────────────────────────────
    const loginAsDemo = () => {
        const demoUser: User = {
            id: 'demo_farmer_001',
            name: 'Rahul Pokhriyal',
            email: 'rahul.pokhriyal@bietdvg.edu',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
            role: 'farmer',
        };
        saveUserSession(demoUser);
        toast.success('Welcome to KrishiSayog Dashboard! 🌾');
        window.location.href = '/dashboard';
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = async () => {
        try {
            if (auth) await signOut(auth);
        } catch (e) {
            console.warn('Sign-out warning:', e);
        }
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success('Successfully logged out');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signInWithGithub, loginAsDemo, logout, checkAuth }}>
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
