import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/landing/Hero";
import { ModelShowcase } from "./components/landing/ModelShowcase";
import { EffectsPreview } from "./components/landing/EffectsPreview";
import { CinemaStudioTeaser } from "./components/landing/CinemaStudioTeaser";
import { PricingTeaser } from "./components/landing/PricingTeaser";
import { EffectsGallery } from "./components/effects/EffectsGallery";
import { CreatePage } from "./components/create/CreatePage";
import { Toaster } from "./components/ui/Toast";
import { useCreateStore } from "./stores/useCreateStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import type { GenerationJob } from "./types";

function HomePage() {
  return (
    <>
      <Hero />
      <ModelShowcase />
      <EffectsPreview />
      <CinemaStudioTeaser />
      <PricingTeaser />
    </>
  );
}

function EffectsPage() {
  return <EffectsGallery />;
}

function CreatePageWrapper() {
  return <CreatePage />;
}

function ScrollRestorationWrapper() {
  useEffect(() => {
    const scrollPositions = new Map<string, number>();

    const saveScrollPosition = () => {
      scrollPositions.set(window.location.pathname, window.scrollY);
    };

    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.get(window.location.pathname);
      if (savedPosition !== undefined) {
        window.scrollTo(0, savedPosition);
      } else {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    window.addEventListener("popstate", restoreScrollPosition);

    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
      window.removeEventListener("popstate", restoreScrollPosition);
    };
  }, []);

  return null;
}

function AppRoutes() {
  const toasts = useCreateStore((state) => 
    state.queue.filter((j: GenerationJob) => j.status === "completed" || j.status === "failed").length
  );
  
  return (
    <>
      <Header />
      <ScrollRestorationWrapper />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/effects" element={<EffectsPage />} />
          <Route path="/create" element={<CreatePageWrapper />} />
          <Route path="/effects/:id" element={<EffectsPage />} />
          <Route path="/cinema-studio" element={<div className="min-h-screen py-20 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">Cinema Studio</h1><p className="text-text-secondary">Coming soon...</p></div></div>} />
          <Route path="/apps" element={<div className="min-h-screen py-20 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">Apps Marketplace</h1><p className="text-text-secondary">Coming soon...</p></div></div>} />
          <Route path="/community" element={<div className="min-h-screen py-20 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">Community</h1><p className="text-text-secondary">Coming soon...</p></div></div>} />
          <Route path="/pricing" element={<div className="min-h-screen py-20 flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">Pricing</h1><p className="text-text-secondary">Coming soon...</p></div></div>} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        toasts={[]}
        onDismiss={() => {}}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-bg text-text-primary"
        >
          <AppRoutes />
        </motion.div>
      </AnimatePresence>
    </BrowserRouter>
  );
}