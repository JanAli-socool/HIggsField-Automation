import { effects, categories } from "../../data/effects";
import { models } from "../../data/models";
import { EffectCard } from "../effects/EffectCard";
import { AssetUploader } from "./AssetUploader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useCreateStore } from "../../stores/useCreateStore";
import { motion } from "framer-motion";
import { Sparkles, Play, ArrowLeft, ChevronDown, Image as ImageIcon, Video as VideoIcon, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { useState } from "react";

export function TemplateMode() {
  const {
    selectedEffectId,
    setSelectedEffectId,
    assets,
    setAsset,
    modelId,
    setModelId,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    addToQueue,
    isGenerating,
  } = useCreateStore();

  const [activeCategory, setActiveCategory] = useState<typeof categories[0]["id"]>("all");
  const [selectedEffect, setSelectedEffect] = useState<typeof effects[0] | null>(null);

  const filteredEffects = activeCategory === "all"
    ? effects
    : effects.filter((e) => e.category === activeCategory || (activeCategory === "trending" && e.isTrending));

  const effect = selectedEffectId ? effects.find((e) => e.id === selectedEffectId) : null;

  const handleGenerate = () => {
    if (!effect) return;

    const jobId = `gen-${Date.now()}`;
    addToQueue({
      id: jobId,
      request: {
        mode: "template",
        prompt: effect.prompt,
        modelId,
        effectId: effect.id,
        assets,
        resolution,
        aspectRatio,
      },
      status: "queued",
      progress: 0,
      createdAt: new Date(),
    });

    setTimeout(() => {
      useCreateStore.getState().updateJob(jobId, { status: "processing", progress: 10 });
      const interval = setInterval(() => {
        const state = useCreateStore.getState();
        const job = state.queue.find((j) => j.id === jobId);
        if (!job || job.status !== "processing") {
          clearInterval(interval);
          return;
        }
        if (job.progress >= 90) {
          clearInterval(interval);
          state.updateJob(jobId, { status: "completed", progress: 100, resultUrl: "/videos/result.webm" });
        } else {
          state.updateJob(jobId, { progress: job.progress + Math.random() * 15 });
        }
      }, 500);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Effect Templates</h2>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">Template Mode</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-4" role="tablist">
              {categories.map((category) => (
                <button
                  key={category.id}
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                    activeCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-surface text-text-secondary hover:text-text-primary hover:bg-border/50"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2"
              role="list"
            >
              {filteredEffects.map((efx, index) => (
                <EffectCard
                  key={efx.id}
                  effect={efx}
                  onClick={() => setSelectedEffect(efx)}
                  index={index}
                />
              ))}
            </motion.div>
          </div>

          {effect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-surface/50 border border-border rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">Selected Effect</h3>
                <button
                  onClick={() => { setSelectedEffectId(null); setSelectedEffect(null); }}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Clear selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-9 bg-surface rounded-lg overflow-hidden relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{effect.title}</p>
                  <p className="text-sm text-text-muted">{effect.category} • {effect.duration} • {effect.resolution}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {effect ? (
            <>
              <div>
                <label className="block font-medium text-text-primary mb-3">Reference Assets</label>
                <AssetUploader assets={assets} onAssetChange={setAsset} />
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-3">Model</label>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-surface rounded-lg overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {models.find((m) => m.id === modelId)?.name || "Seedance 2.5"}
                      </p>
                      <p className="text-xs text-text-muted">Auto-selected for effect</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </Button>
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-3">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {["720p", "1080p", "4k"].map((res) => (
                    <Button
                      key={res}
                      variant={resolution === res ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setResolution(res as any)}
                      className="py-2"
                    >
                      {res.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "16:9", label: "16:9", icon: <VideoIcon className="w-4 h-4" /> },
                    { value: "9:16", label: "9:16", icon: <ImageIcon className="w-4 h-4" /> },
                    { value: "1:1", label: "1:1", icon: <Settings className="w-4 h-4" /> },
                  ].map((ratio) => (
                    <Button
                      key={ratio.value}
                      variant={aspectRatio === ratio.value ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio.value as any)}
                      className="py-2 flex items-center justify-center gap-1.5"
                    >
                      {ratio.icon}
                      {ratio.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  size="lg"
                  className="w-full justify-center gap-2"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Play className="w-5 h-5" />
                  Generate with Effect
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-surface/50 border border-border rounded-xl"
            >
              <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-text-primary mb-2">Select an Effect</h3>
              <p className="text-text-secondary text-sm">Choose a template from the gallery to get started</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}