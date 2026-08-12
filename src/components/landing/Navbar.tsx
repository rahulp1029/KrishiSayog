import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sprout } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Sprout className="h-7 w-7 text-primary" />
          <span className="text-gradient-primary font-heading">KrishiSayog</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.includes("#") ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/chatbot">
            <Button variant="ghost" size="sm">AI Chatbot</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
          <Link to="/dashboard">
            <Button className="hero-gradient text-primary-foreground font-semibold" size="default">Get Started</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2 space-y-2 animate-slide-up">
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.includes("#") ? (
              <Link
                key={item.label}
                to={item.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          <Link to="/chatbot" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-sm">AI Chatbot</Button>
          </Link>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full mt-1">Login</Button>
          </Link>
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <Button className="w-full mt-1 hero-gradient text-primary-foreground font-semibold">Get Started</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
