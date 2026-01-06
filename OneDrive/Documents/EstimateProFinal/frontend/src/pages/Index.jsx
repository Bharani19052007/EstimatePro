import { Link } from "react-router-dom";
import { Calculator, TrendingUp, DollarSign, Users, ChevronRight, Star, BarChart3, PieChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-300">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Project<span className="text-primary">Estimator</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&q=80"
            alt="Project Management"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 pt-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm text-primary-foreground/90">Trusted by 10,000+ project managers</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
              Estimate Your Projects
              <span className="block text-accent">With Precision</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-lg animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Create detailed project estimations, manage resources, and track costs with our comprehensive estimation platform.
            </p>

            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/login">
                <Button variant="accent" size="xl" className="gap-2">
                  Start Estimating
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/estimation-dashboard">
                <Button variant="hero-outline" size="xl">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">500+</p>
                <p className="text-primary-foreground/70">Projects</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">10K+</p>
                <p className="text-primary-foreground/70">Estimations Created</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">4.9</p>
                <p className="text-primary-foreground/70">Accuracy Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Card */}
        <div className="hidden lg:block absolute right-20 top-1/2 -translate-y-1/2 animate-float">
          <div className="card-travel p-6 w-80 shadow-elevated">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Web Development</h3>
                <p className="text-sm text-muted-foreground">Q1 2026 Project</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>$125,000 budget</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-sage" />
                <span>12 weeks duration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-accent" />
                <span>8 team members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to estimate
            </h2>
            <p className="text-lg text-muted-foreground">
              From cost analysis to resource planning, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Cost Estimation",
                description: "Calculate detailed project costs with breakdown and contingency planning",
                color: "bg-sky-light text-primary",
              },
              {
                icon: Users,
                title: "Resource Management",
                description: "Allocate team members and track resource availability efficiently",
                color: "bg-sage-light text-sage",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Generate insights and comprehensive reports from your estimations",
                color: "bg-coral-light text-accent",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card-travel p-8 text-center animate-slide-up"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} mx-auto mb-6 flex items-center justify-center`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Recent Projects
              </h2>
              <p className="text-muted-foreground">Explore our latest project estimations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.name}
                className="animate-slide-up"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6 max-w-2xl mx-auto">
            Ready to estimate your projects?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Join thousands of project managers who estimate smarter with ProjectEstimator
          </p>
          <Link to="/login">
            <Button variant="accent" size="xl" className="gap-2">
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Project<span className="text-primary">Estimator</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 ProjectEstimator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
