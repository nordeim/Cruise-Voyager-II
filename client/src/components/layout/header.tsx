import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ship, Menu, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
  };
  
  const openLoginModal = () => {
    setLoginModalOpen(true);
    setRegisterModalOpen(false);
  };
  
  const openRegisterModal = () => {
    setRegisterModalOpen(true);
    setLoginModalOpen(false);
  };
  
  const closeModals = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };
  
  const isActive = (path: string) => location === path;
  
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find Cruises", path: "/cruises" },
    { name: "Destinations", path: "/destinations" },
    { name: "Deals", path: "/deals" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-primary font-heading flex items-center">
              <Ship className="mr-2" />
              <span>Cruise Voyager</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`font-medium transition-colors ${
                  isActive(link.path) ? "text-primary" : "hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="link" className="flex items-center space-x-1 font-medium text-primary">
                    <span>{user?.firstName || user?.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/my-bookings">My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Account Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div id="auth-buttons">
                <Button 
                  variant="link" 
                  className="font-medium text-primary hover:text-primary-dark"
                  onClick={openLoginModal}
                >
                  Sign In
                </Button>
                <Button
                  className="ml-4 bg-primary hover:bg-primary-dark text-white"
                  onClick={openRegisterModal}
                >
                  Register
                </Button>
              </div>
            )}
          </nav>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <span className="sr-only">Open mobile menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
          <div className="py-6 space-y-6">
            <Link 
              href="/" 
              className="flex items-center text-2xl font-bold text-primary mb-6"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Ship className="mr-2" />
              <span>Cruise Voyager</span>
            </Link>
            
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-2 py-1 rounded-md font-medium ${
                    isActive(link.path) 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-primary/5 hover:text-primary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            <div className="pt-4 border-t border-neutral-light">
              {isAuthenticated ? (
                <>
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    Logged in as <span className="text-primary font-medium">{user?.email}</span>
                  </div>
                  <Link
                    href="/my-bookings"
                    className="block px-2 py-2 rounded-md hover:bg-primary/5 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-2 py-2 rounded-md hover:bg-primary/5 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-2 py-2 rounded-md text-destructive hover:bg-destructive/5"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLoginModal();
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openRegisterModal();
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Sign In</DialogTitle>
          </DialogHeader>
          <LoginForm onSuccess={closeModals} />
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-primary"
                onClick={() => {
                  setLoginModalOpen(false);
                  setRegisterModalOpen(true);
                }}
              >
                Register now
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Register Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create an Account</DialogTitle>
          </DialogHeader>
          <RegisterForm onSuccess={closeModals} />
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-primary"
                onClick={() => {
                  setRegisterModalOpen(false);
                  setLoginModalOpen(true);
                }}
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
