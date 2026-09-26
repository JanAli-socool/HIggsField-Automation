import { CreatePage } from "../components/create/CreatePage";
import { GenerationQueue } from "../components/create/GenerationQueue";
import { useCreateStore } from "../stores/useCreateStore";
import { Container } from "../components/common/Container";
import { motion } from "framer-motion";

export function DashboardPage() {
  const { queue, activeTab, setActiveTab } = useCreateStore();

  return (
    <section id="create" className="py-16 lg:py-24 min-h-screen">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-2">
                Create
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl">
                Generate videos from text or choose from cinematic effect templates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-1" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "prompt"}
              onClick={() => setActiveTab("prompt")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === "prompt"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-border/50"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Prompt
              </span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "template"}
              onClick={() => setActiveTab("template")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === "template"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-border/50"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Templates
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === "prompt" ? <CreatePage /> : <TemplateModeWrapper />}
        </motion.div>
      </Container>

      <GenerationQueue
        queue={queue}
        onRemove={(id) => useCreateStore.getState().removeFromQueue(id)}
      />
    </section>
  );
}

// Wrapper to avoid circular import
import { TemplateMode } from "../components/create/TemplateMode";
import { cn } from "../lib/utils";

function TemplateModeWrapper() {
  return <TemplateMode />;
}