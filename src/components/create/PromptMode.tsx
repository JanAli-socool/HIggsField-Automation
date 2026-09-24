import { models } from "../../data/models";
import { ModelPicker } from "./ModelPicker";
import { PromptEditor } from "./PromptEditor";
import { AssetUploader } from "./AssetUploader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useCreateStore } from "../../stores/useCreateStore";
import { motion } from "framer-motion";
import { Sparkles, Zap, Settings, ChevronDown, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function PromptMode() {
  const {
    prompt,
    setPrompt,
    modelId,
    setModelId,
    assets,
    setAsset,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    addToQueue,
    isGenerating,
  } = useCreateStore();

  const selectedModel = models.find((m) => m.id === modelId) || models[0];

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    const jobId = `gen-${Date.now()}`;
    addToQueue({
      id: jobId,
      request: {
        mode: "prompt",
        prompt,
        modelId,
        assets,
        resolution,
        aspectRatio,
      },
      status: "queued",
      progress: 0,
      createdAt: new Date(),
    });

    // Simulate generation
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
        <h2 className="text-xl font-semibold text-text-primary">Text to Video</h2>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">Prompt Mode</Badge>
        </div>
      </div>

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        showRawPrompt={false}
        onToggleRawPrompt={() => {}}
        placeholder="Describe your video... e.g., 'A cyberpunk city at night with flying cars, neon lights, rain-slicked streets, cinematic lighting'"
      />

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
              onClick={() => useCreateStore.getState().setActiveTab("prompt")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-surface rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{selectedModel.name}</p>
                  <p className="text-xs text-text-muted">{selectedModel.tagline}</p>
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
              disabled={isGenerating || !prompt.trim()}
            >
              <Sparkles className="w-5 h-5" />
              Generate Video
            </Button>
            <p className="text-center text-xs text-text-muted mt-2">
              Uses {selectedModel.priceTier === "free" ? "free" : selectedModel.priceTier} credits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}