import { useState } from "react";
import { effects, categories } from "../../data/effects";
import type { Category } from "../../types";
import { CategoryFilter } from "./CategoryFilter";
import { EffectCard } from "./EffectCard";
import { EffectDetailDrawer } from "./EffectDetailDrawer";
import { Container } from "../common/Container";
import { Skeleton, SkeletonEffectCard } from "../ui/Skeleton";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function EffectsGallery() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedEffect, setSelectedEffect] = useState<typeof effects[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredEffects = activeCategory === "all"
    ? effects
    : effects.filter((e) => e.category === activeCategory || (activeCategory === "trending" && e.isTrending));

  return (
    <section id="effects" className="py-16 lg:py-24 min-h-screen">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-4">
            Visual Effects
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl">
            {filteredEffects.length} cinematic AI effects — choose a template, add your media, generate in seconds.
          </p>
        </motion.div>

        <CategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={(cat: string) => setActiveCategory(cat as Category)}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
          role="list"
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonEffectCard key={i} />
            ))
          ) : (
            filteredEffects.map((effect, index) => (
              <EffectCard
                key={effect.id}
                effect={effect}
                onClick={() => setSelectedEffect(effect)}
                index={index}
              />
            ))
          )}
        </motion.div>

        {filteredEffects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-text-secondary">No effects found in this category.</p>
          </motion.div>
        )}
      </Container>

      <EffectDetailDrawer
        effect={selectedEffect}
        isOpen={!!selectedEffect}
        onClose={() => setSelectedEffect(null)}
      />
    </section>
  );
}