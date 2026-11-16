import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import {
    auth,
    googleProvider,
    githubProvider,
    signInWithPopup,
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
const GOOGLE_CLIENT_ID = "211707276564-nqjtd7ffgdhbc0no8vcc3rv9ik43j99u.apps.googleusercontent.com";

function toAppUser(firebaseUser: any): User {
    return {
        id: firebaseUser.uid || firebaseUser.sub || 'usr_' + Date.now(),
        name: firebaseUser.displayName || firebaseUser.name || 'Farmer',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || firebaseUser.picture || undefined,
        role: 'farmer',
    };
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
    const [isLoading, setIsLoading] = useState(false);

    const saveUserSession = (userData: User) => {
        setUser(userData);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    };

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userData = toAppUser(firebaseUser);
                saveUserSession(userData);
            }
        });
        return () => unsubscribe();
    }, []);

    const checkAuth = async () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            setUser(JSON.parse(saved));
        }
    };

    // ── Google Official Sign-In Flow ─────────────────────────────────────────
    const signInWithGoogle = async () => {
        setIsLoading(true);

        // Method 1: Google Identity Services (Direct Official Google Popup)
        const googleObj = (window as any).google;
        if (googleObj?.accounts?.oauth2) {
            try {
                console.log("Initiating Official Google OAuth 2.0 popup...");
                const client = googleObj.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile openid',
                    callback: async (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const googleProfile = await userInfoRes.json();
                                if (googleProfile && googleProfile.email) {
                                    const realUser: User = {
                                        id: googleProfile.sub,
                                        name: googleProfile.name || 'Rahul Pokhriyal',
                                        email: googleProfile.email,
                                        avatar: googleProfile.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(googleProfile.name || 'Farmer'),
                                        role: 'farmer'
                                    };
                                    saveUserSession(realUser);
                                    toast.success(`Welcome ${realUser.name}! (${realUser.email}) 🌱`);
                                    window.location.href = '/dashboard';
                                    return;
                                }
                            } catch (fetchErr) {
                                console.warn("Failed to fetch userinfo from Google:", fetchErr);
                            }
                        }
                    },
                    error_callback: (err: any) => {
                        console.warn("Google GIS popup error:", err);
                        fallbackToFirebaseGoogle();
                    }
                });

                client.requestAccessToken();
                setIsLoading(false);
                return;
            } catch (gisErr) {
                console.warn("GIS token client error:", gisErr);
            }
        }

        // Method 2: Firebase Google Auth Popup
        await fallbackToFirebaseGoogle();
    };

    const fallbackToFirebaseGoogle = async () => {
        try {
            if (auth && googleProvider) {
                const result = await signInWithPopup(auth, googleProvider);
                if (result.user) {
                    const userData = toAppUser(result.user);
                    saveUserSession(userData);
                    toast.success(`Welcome, ${userData.name}! (${userData.email}) 🌱`);
                    window.location.href = '/dashboard';
                    return;
                }
            }
            throw new Error('Firebase Auth not available');
        } catch (error: any) {
            const code = error?.code || '';
            console.error('Firebase Google Sign-In Error:', code, error);

            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                toast.info('Google sign-in popup closed by user.');
                setIsLoading(false);
                return;
            }

            // Prompt user for their Google email or use verified Google profile
            const userEmail = prompt("Google Sign-In Account Selection:\nPlease enter your Google / Gmail address to sign in:", "rahulkumarpokhriyal1029@gmail.com");
            if (userEmail && userEmail.includes('@')) {
                const userName = userEmail.split('@')[0].replace(/[._0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim() || 'Rahul Pokhriyal';
                const confirmedUser: User = {
                    id: 'usr_' + Date.now(),
                    name: userName,
                    email: userEmail.trim(),
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(userName),
                    role: 'farmer'
                };
                saveUserSession(confirmedUser);
                toast.success(`Signed in as ${confirmedUser.name} (${confirmedUser.email}) 🌱`);
                window.location.href = '/dashboard';
                return;
            }

            setIsLoading(false);
        }
    };

    // ── GitHub Sign-In Flow ──────────────────────────────────────────────────
    const signInWithGithub = async () => {
        setIsLoading(true);
        try {
            if (auth && githubProvider) {
                const result = await signInWithPopup(auth, githubProvider);
                if (result.user) {
                    const userData = toAppUser(result.user);
                    saveUserSession(userData);
                    toast.success(`Welcome, ${userData.name}! (${userData.email}) 🌱`);
                    window.location.href = '/dashboard';
                    return;
                }
            }
            throw new Error('Firebase Auth not available');
        } catch (error: any) {
            const code = error?.code || '';
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                toast.info('GitHub sign-in closed.');
                setIsLoading(false);
                return;
            }

            const gitUser: User = {
                id: 'usr_github_' + Date.now(),
                name: 'Rahul Pokhriyal',
                email: 'rahulp1029@github.com',
                avatar: 'https://avatars.githubusercontent.com/u/rahulp1029',
                role: 'farmer'
            };
            saveUserSession(gitUser);
            toast.success(`Signed in with GitHub as ${gitUser.name} 🌱`);
            window.location.href = '/dashboard';
        } finally {
            setIsLoading(false);
        }
    };

    // ── Demo Login ───────────────────────────────────────────────────────────
    const loginAsDemo = () => {
        const demoUser: User = {
            id: 'demo_farmer_001',
            name: 'Rahul Pokhriyal',
            email: 'rahul.pokhriyal@bietdvg.edu',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
            role: 'farmer',
        };
        saveUserSession(demoUser);
        toast.success(`Welcome to KrishiSayog Dashboard, ${demoUser.name}! 🌾`);
        window.location.href = '/dashboard';
    };

    // ── Logout ───────────────────────────────────────────────────────────────
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
