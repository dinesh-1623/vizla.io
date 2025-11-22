/**
 * Landing Page - Public Marketing Page
 * 
 * Beautiful landing page with hero, value pillars, and CTA
 */

import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthGate } from '@/components/auth/AuthGate';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  Users, 
  Camera, 
  Truck, 
  Package,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <AuthGate>
      <div className="min-h-screen bg-vizla-canvas">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-vizla-glassBorder bg-vizla-glass/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="default" linkToHome={false} showText={true} />
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth?tab=login')}
                className="hidden sm:flex"
              >
                Log in
              </Button>
              <Button 
                onClick={() => navigate('/auth?tab=signup')}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90"
              >
                Sign up free
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-vizla-text-primary mb-6">
            Vizla Console
            <br />
            <span className="text-vizla-brand-primary">Faster Tows. Smarter Dispatch.</span>
          </h1>
          <p className="text-xl text-vizla-text-secondary max-w-3xl mx-auto mb-10">
            Locate, prioritize, and route repossessions with real-time status, 
            capacity awareness, and time-saved insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth?tab=signup')}
              className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90 px-8"
            >
              Sign up free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth?tab=login')}
              className="px-8"
            >
              Log in
            </Button>
          </div>
        </section>

        {/* Value Pillars */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vizla-text-primary">
            Why Vizla Console?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PillarCard
              icon={<MapPin className="w-8 h-8" />}
              title="Locate & Prioritize"
              description="See Located, Blocked, Stashed in one view. Real-time status tracking across all vehicles."
            />
            <PillarCard
              icon={<Clock className="w-8 h-8" />}
              title="Capacity & Shifts"
              description="Know if zones are on track. Get recommended actions to optimize shift utilization."
            />
            <PillarCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Time Matrix"
              description="Group 4-5 jobs efficiently. Estimate total time and $ impact per route."
            />
            <PillarCard
              icon={<Users className="w-8 h-8" />}
              title="Dispatch to Drivers"
              description="Assign by client, zone, and time. Instant notifications keep everyone in sync."
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-20 bg-vizla-elev1 rounded-3xl mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vizla-text-primary">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              step="1"
              icon={<Camera className="w-12 h-12" />}
              title="Spot"
              description="Upload photo with location. Auto-tag status & zone for instant tracking."
            />
            <StepCard
              step="2"
              icon={<Truck className="w-12 h-12" />}
              title="Dispatch"
              description="Capacity-aware assignment. See workload and recommended actions in real-time."
            />
            <StepCard
              step="3"
              icon={<Package className="w-12 h-12" />}
              title="Tow & Stash"
              description="Time savings quantified at every step. Finalize recoveries with full audit trail."
            />
          </div>
        </section>

        {/* Features List */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vizla-text-primary">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FeatureItem text="Real-time vehicle location tracking" />
            <FeatureItem text="Client and zone-based filtering" />
            <FeatureItem text="Shift capacity optimization" />
            <FeatureItem text="Route time estimation" />
            <FeatureItem text="Driver performance analytics" />
            <FeatureItem text="Stash vs lot routing insights" />
            <FeatureItem text="Mobile-ready responsive design" />
            <FeatureItem text="Dark & light theme modes" />
          </div>
        </section>

        {/* CTA Banner */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-vizla-brand-primary/10 border border-vizla-brand-primary/20 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4 text-vizla-text-primary">
              Start optimizing your fleet today
            </h2>
            <p className="text-vizla-text-secondary mb-8 text-lg">
              Join teams using Vizla Console to increase efficiency and reduce costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth?tab=signup')}
                className="bg-vizla-brand-primary hover:bg-vizla-brand-primary/90 px-8"
              >
                Sign up free
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                onClick={() => navigate('/auth?tab=login')}
              >
                Already have an account? Log in
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-vizla-glassBorder py-8">
          <div className="container mx-auto px-4 text-center text-vizla-text-secondary">
            <p>&copy; 2024 Vizla Console. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AuthGate>
  );
}

function PillarCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-vizla-glassElev border border-vizla-glassBorder rounded-2xl p-6 hover:border-vizla-brand-primary/30 transition-colors">
      <div className="text-vizla-brand-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-vizla-text-primary">{title}</h3>
      <p className="text-vizla-text-secondary">{description}</p>
    </div>
  );
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-vizla-glassElev border border-vizla-glassBorder rounded-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vizla-brand-primary/20 text-vizla-brand-primary mb-4">
        {icon}
      </div>
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-vizla-brand-primary text-white text-sm font-bold mb-3">
        {step}
      </div>
      <h3 className="text-2xl font-bold mb-3 text-vizla-text-primary">{title}</h3>
      <p className="text-vizla-text-secondary">{description}</p>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-vizla-success flex-shrink-0" />
      <span className="text-vizla-text-secondary">{text}</span>
    </div>
  );
}


