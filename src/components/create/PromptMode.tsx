import { models } from "../../data/models";
import { PromptEditor } from "./PromptEditor";
import { AssetUploader } from "./AssetUploader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useCreateStore } from "../../stores/useCreateStore";
import { motion } from "framer-motion";
import { Sparkles, Settings, ChevronDown, Image as ImageIcon, Video as VideoIcon, Loader2, Zap as ZapIcon, Brain, ArrowRight } from "lucide-react";

export function PromptMode() {
  const {
    prompt,
    setPrompt,
    modelId,
    setModelId: _setModelId,
    assets,
    setAsset,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    quality,
    setQuality,
    steps: _steps,
    setSteps: _setSteps,
    guidanceScale: _guidanceScale,
    setGuidanceScale: _setGuidanceScale,
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
    enhancedPrompt,
    workflowRecommendation,
    isEnhancing,
    isDetectingWorkflow: _isDetectingWorkflow,
    enhancePrompt,
    applyEnhancedPrompt,
    clearEnhancement,
  } = useCreateStore();

  const selectedModel = models.find((m) => m.id === modelId) || models[0];
  const _selectedModel = selectedModel;

  const hasEnhancedPrompt = enhancedPrompt && enhancedPrompt.enhanced_prompt !== prompt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Text to Video</h2>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">Prompt Mode</Badge>
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

      {workflowRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center gap-2"
        >
          <ZapIcon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            <strong>Auto-detected: </strong>{workflowRecommendation.workflow.replace(/_/g, " ")}
            <span className="text-text-muted ml-2">•</span>
            <strong> Recommended model: </strong>{workflowRecommendation.recommended_model}
          </span>
          <Badge variant="default" size="sm">{workflowRecommendation.reasoning}</Badge>
        </motion.div>
      )}

      {hasEnhancedPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-sm"
        >
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-2">Enhanced prompt available</p>
              <p className="text-xs text-text-muted mb-2">{enhancedPrompt?.reasoning}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={applyEnhancedPrompt}
                  className="gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  Apply Enhanced Prompt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearEnhancement}
                  className="gap-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="relative">
        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          showRawPrompt={false}
          onToggleRawPrompt={() => {}}
          placeholder="Describe your video... e.g., 'A cyberpunk city at night with flying cars, neon lights, rain-slicked streets, cinematic lighting'"
        />
        {prompt.trim().length >= 10 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={enhancePrompt}
            disabled={isEnhancing || isGenerating}
            className="absolute right-3 top-3 gap-1"
          >
            <ZapIcon className="w-4 h-4" />
            {isEnhancing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              "Enhance"
            )}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block font-medium text-text-primary mb-3">Reference Assets (Optional)</label>
            <AssetUploader assets={assets} onAssetChange={setAsset} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-medium text-text-primary mb-3">Model</label>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => {}}
              disabled={isGenerating}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-surface rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{models.find((m) => m.id === modelId)?.name || "Wan 2.1"}</p>
                  <p className="text-xs text-text-muted">Video generation model</p>
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
              onClick={() => generate("prompt")}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </Button>
            <p className="text-center text-xs text-text-muted mt-2">
              Estimated cost: ~10 credits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}