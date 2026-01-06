import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-sky-light flex items-center justify-center mb-8">
              <Compass className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
            <h2 className="text-2xl font-bold text-foreground mb-4">Page not found</h2>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
              Oops! The page you're looking for seems to have wandered off. Let's get you back on track.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/">
                <Button variant="accent" size="lg" className="gap-2">
                  <Home className="w-5 h-5" />
                  Go Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="gap-2">
                  <Compass className="w-5 h-5" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
