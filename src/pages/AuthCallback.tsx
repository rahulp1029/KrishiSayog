import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success === "true") {
            toast.success("Successfully authenticated!");
            checkAuth().then(() => {
                navigate("/dashboard");
            });
        } else {
            toast.error(error || "Authentication failed.");
            navigate("/login");
        }
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Completing authentication...</p>
            </div>
        </div>
    );
}
