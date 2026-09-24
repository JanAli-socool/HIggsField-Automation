import { effects, categories } from "../../data/effects";
import { models } from "../../data/models";
import { EffectCard } from "../effects/EffectCard";
import { AssetUploader } from "./AssetUploader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useCreateStore } from "../../stores/useCreateStore";
import { motion } from "framer-motion";
import { Sparkles, Play, ArrowLeft, ChevronDown, Image as ImageIcon, Video as VideoIcon, Settings, Loader2 } from "lucide-react";
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
    quality,
    setQuality,
    steps,
    setSteps,
    guidanceScale,
    setGuidanceScale,
    seed,
    setSeed,
    durationSeconds,
    setDurationSeconds,
    fps,
    setFps,
    motionStrength,
    setMotionStrength,
    cameraMotion,
    setCameraMotion,
    numOutputs,
    setNumOutputs,
    generate,
    isGenerating,
    error,
  } = useCreateStore();

  const [activeCategory, setActiveCategory] = useState<typeof categories[0]["id"]>("all");
  const [selectedEffect, setSelectedEffect] = useState<typeof effects[0] | null>(null);

  const filteredEffects = activeCategory === "all"
    ? effects
    : effects.filter((e) => e.category === activeCategory || (activeCategory === "trending" && e.isTrending));

  const effect = selectedEffectId ? effects.find((e) => e.id === selectedEffectId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Effect Templates</h2>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">Template Mode</Badge>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

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
                  disabled={isGenerating}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-surface rounded-lg overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {models.find((m) => m.id === modelId)?.name || "Wan 2.1"}
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
                      disabled={isGenerating}
                      className="py-2"
                    >
                      {res.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "16:9", label: "16:9", icon: <VideoIcon className="w-4 h-4" /> },
                    { value: "9:16", label: "9:16", icon: <ImageIcon className="w-4 h-4" /> },
                    { value: "1:1", label: "1:1", icon: <Settings className="w-4 h-4" /> },
                    { value: "4:3", label: "4:3", icon: <Settings className="w-4 h-4" /> },
                  ].map((ratio) => (
                    <Button
                      key={ratio.value}
                      variant={aspectRatio === ratio.value ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio.value as any)}
                      disabled={isGenerating}
                      className="py-2 flex items-center justify-center gap-1.5"
                    >
                      {ratio.icon}
                      {ratio.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-primary mb-3">Quality</label>
                <div className="grid grid-cols-3 gap-2">
                  {["preview", "standard", "high"].map((q) => (
                    <Button
                      key={q}
                      variant={quality === q ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setQuality(q as any)}
                      disabled={isGenerating}
                      className="py-2 capitalize"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-text-primary mb-3">Duration (seconds)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 5)}
                    min="1"
                    max="30"
                    step="1"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-3">FPS</label>
                  <input
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value) || 24)}
                    min="8"
                    max="60"
                    step="1"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-text-primary mb-3">Motion Strength</label>
                  <input
                    type="range"
                    value={motionStrength}
                    onChange={(e) => setMotionStrength(parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    step="0.1"
                    disabled={isGenerating}
                    className="w-full h-2 bg-border appearance-none rounded-lg accent-primary"
                  />
                  <p className="text-sm text-text-muted mt-1">{Math.round(motionStrength * 100)}%</p>
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-3">Camera Motion</label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[
                      "none",
                      "pan_left",
                      "pan_right",
                      "tilt_up",
                      "tilt_down",
                      "zoom_in",
                      "zoom_out",
                      "dolly_in",
                      "dolly_out",
                      "orbit",
                      "tracking",
                      "handheld",
                    ].map((motion) => (
                      <option key={motion} value={motion}>
                        {motion.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-text-primary mb-3">Number of Outputs</label>
                  <input
                    type="number"
                    value={numOutputs}
                    onChange={(e) => setNumOutputs(parseInt(e.target.value) || 1)}
                    min="1"
                    max="4"
                    step="1"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-text-primary mb-3">Seed (optional)</label>
                  <input
                    type="number"
                    value={seed || ""}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="2147483647"
                    step="1"
                    disabled={isGenerating}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Random"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  size="lg"
                  className="w-full justify-center gap-2"
                  onClick={() => generate("template", effect.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Generate with Effect
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-text-muted mt-2">
                  Estimated cost: ~12 credits
                </p>
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