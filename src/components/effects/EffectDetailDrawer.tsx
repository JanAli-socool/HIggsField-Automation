import type { Effect } from "../../types";
import { Badge } from "../ui/Badge";
import { VideoPlayer } from "../ui/VideoPlayer";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { motion } from "framer-motion";
import { X, Play, Download, Share2, ExternalLink, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { useCreateStore } from "../../stores/useCreateStore";

interface EffectDetailDrawerProps {
  effect: Effect | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EffectDetailDrawer({ effect, isOpen, onClose }: EffectDetailDrawerProps) {
  const { 
    setSelectedEffectId, 
    setAsset, 
    setModelId, 
    setAspectRatio, 
    setResolution, 
    addToQueue,
    isGenerating
  } = useCreateStore();

  const [isGeneratingEffect, setIsGeneratingEffect] = useState(false);

  const handleUseEffect = () => {
    if (!effect) return;
    setSelectedEffectId(effect.id);
    setModelId(effect.model.toLowerCase().replace(/\s+/g, "-"));
    setResolution(effect.resolution.toLowerCase() as any);
    setAspectRatio("9:16");
    onClose();
    setTimeout(() => {
      document.getElementById("create")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleGenerateDirect = async () => {
    if (!effect) return;
    
    setIsGeneratingEffect(true);
    const jobId = `gen-${Date.now()}`;
    
    addToQueue({
      id: jobId,
      request: {
        mode: "template",
        prompt: effect.prompt,
        modelId: effect.model.toLowerCase().replace(/\s+/g, "-"),
        effectId: effect.id,
        assets: {
          character: { type: "character", file: null, preview: null },
          location: { type: "location", file: null, preview: null },
          product: { type: "product", file: null, preview: null },
        },
        resolution: effect.resolution.toLowerCase() as any,
        aspectRatio: "9:16",
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
          setIsGeneratingEffect(false);
          return;
        }
        if (job.progress >= 90) {
          clearInterval(interval);
          state.updateJob(jobId, { status: "completed", progress: 100, resultUrl: "/videos/result.webm" });
          setIsGeneratingEffect(false);
        } else {
          state.updateJob(jobId, { progress: job.progress + Math.random() * 15 });
        }
      }, 500);
    }, 500);

    onClose();
  };

  if (!effect) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={effect.title}
      side="right"
      size="lg"
    >
      <div className="space-y-6">
        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-surface">
          <VideoPlayer
            src={effect.videoUrl}
            poster={effect.thumbnailUrl}
            fallback="/videos/placeholder-effect.jpg"
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button variant="primary" size="lg" onClick={handleUseEffect} className="flex-1" disabled={isGeneratingEffect}>
              <Play className="w-5 h-5 mr-2" />
              Use This Effect
            </Button>
            <Button variant="primary" size="lg" onClick={handleGenerateDirect} className="flex-1" disabled={isGenerating || isGeneratingEffect}>
              {isGeneratingEffect ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Generate Now
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {effect.isNew && <Badge variant="new">NEW</Badge>}
            {effect.isTrending && <Badge variant="trending">TRENDING</Badge>}
            {effect.isPro && <Badge variant="pro">PRO</Badge>}
            <Badge variant="4k">{effect.resolution}</Badge>
            <Badge variant="1min">{effect.duration}</Badge>
          </div>

          <p className="text-text-secondary leading-relaxed">{effect.prompt}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <h4 className="font-medium text-text-primary mb-2">Model</h4>
              <p className="text-text-secondary">{effect.model}</p>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-2">Category</h4>
              <p className="text-text-secondary capitalize">{effect.category}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-text-primary mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {effect.tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1 justify-center" onClick={handleUseEffect} disabled={isGeneratingEffect}>
              <Play className="w-4 h-4 mr-2" />
              Use in Editor
            </Button>
            <Button variant="ghost" className="flex-1 justify-center">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

import { useState } from "react";