import type { Effect } from "../../types";
import { Badge } from "../ui/Badge";
import { VideoPlayer } from "../ui/VideoPlayer";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { motion } from "framer-motion";
import { X, Play, Download, Share2, ExternalLink, Sparkles, Zap, Crown } from "lucide-react";
import { useCreateStore } from "../../stores/useCreateStore";

interface EffectDetailDrawerProps {
  effect: Effect | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EffectDetailDrawer({ effect, isOpen, onClose }: EffectDetailDrawerProps) {
  const { setSelectedEffectId, setAsset, setModelId, setAspectRatio, setResolution, activeTab } = useCreateStore();

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
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button variant="primary" size="lg" onClick={handleUseEffect} className="flex-1">
              <Play className="w-5 h-5 mr-2" />
              Use This Effect
            </Button>
            <Button variant="ghost" size="lg" className="flex-1">
              <Download className="w-5 h-5 mr-2" />
              Download Preview
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
            <Button variant="outline" className="flex-1 justify-center" onClick={handleUseEffect}>
              <Play className="w-4 h-4 mr-2" />
              Generate
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