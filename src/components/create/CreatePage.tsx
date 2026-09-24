import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import { PromptMode } from "./PromptMode";
import { TemplateMode } from "./TemplateMode";
import { GenerationQueue } from "./GenerationQueue";
import { useCreateStore } from "../../stores/useCreateStore";
import { Container } from "../common/Container";
import { motion } from "framer-motion";

export function CreatePage() {
  const { activeTab, setActiveTab, queue } = useCreateStore();

  return (
    <section id="create" className="py-16 lg:py-24 min-h-screen">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-4">
            Create
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl">
            Generate videos from text or choose from cinematic effect templates.
          </p>
        </motion.div>

        <Tabs defaultValue="prompt" onChange={(value: string) => setActiveTab(value as "prompt" | "template")} className="max-w-5xl">
          <TabsList className="w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="prompt">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Prompt
              </span>
            </TabsTrigger>
            <TabsTrigger value="template">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Templates
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <PromptMode />
          </TabsContent>

          <TabsContent value="template">
            <TemplateMode />
          </TabsContent>
        </Tabs>
      </Container>

      <GenerationQueue
        queue={queue}
        onRemove={(id) => useCreateStore.getState().removeFromQueue(id)}
      />
    </section>
  );
}