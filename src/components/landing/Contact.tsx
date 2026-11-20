import { Github, Bug } from "lucide-react";

const REPO_URL = "https://github.com/HariomAcharya17/MIRA";

export const Contact = () => (
  <section id="contact" className="px-4 sm:px-6 py-20 border-t border-border">
    <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Feedback and questions</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-md">
          Found a bug or have an idea? Open an issue on GitHub. The source code is public if you want to look at how something works.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`${REPO_URL}/issues/new`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border p-5 hover:bg-accent transition-colors"
        >
          <Bug className="size-5 text-brand" />
          <div className="mt-3 font-medium">Report an issue</div>
          <div className="mt-1 text-sm text-muted-foreground">Bugs, feature requests, model problems</div>
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border p-5 hover:bg-accent transition-colors"
        >
          <Github className="size-5 text-brand" />
          <div className="mt-3 font-medium">View the source</div>
          <div className="mt-1 text-sm text-muted-foreground">github.com/HariomAcharya17/MIRA</div>
        </a>
      </div>
    </div>
  </section>
);
