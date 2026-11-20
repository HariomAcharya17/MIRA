import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CallToAction = () => (
  <section className="pb-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-12 sm:px-12 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Start a chat in seconds
          </h2>
          <p className="mt-2 text-primary-foreground/70 leading-relaxed">
            No setup and no API keys on your side. Create an account to keep
            your history across devices.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/ai">
              Open Mira <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/signup">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
