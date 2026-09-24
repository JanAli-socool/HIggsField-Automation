import { Play, TrendingUp, Sparkles, Crown } from "lucide-react";
import type { Effect } from "../../types";
import { Badge } from "../ui/Badge";
import { VideoPlayer } from "../ui/VideoPlayer";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

interface EffectCardProps {
  effect: Effect;
  onClick: () => void;
  index: number;
}

export function EffectCard({ effect, onClick, index }: EffectCardProps) {
  const hoverProgress = useMotionValue(0);
  const scale = useSpring(useTransform(hoverProgress, [0, 1], [1, 1.02]), { stiffness: 300, damping: 30 });
  const overlayOpacity = useSpring(useTransform(hoverProgress, [0, 1], [0, 1]), { stiffness: 300, damping: 30 });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.03 }}
      onMouseEnter={() => hoverProgress.set(1)}
      onMouseLeave={() => hoverProgress.set(0)}
      style={{ scale }}
      className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`View ${effect.title} effect`}
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        <VideoPlayer
          src={effect.videoUrl}
          poster={effect.thumbnailUrl}
          autoplayOnHover
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent flex items-end justify-between p-4"
        >
          <div className="flex gap-1">
            {effect.isNew && <Badge variant="new" size="sm">NEW</Badge>}
            {effect.isTrending && <Badge variant="trending" size="sm">TRENDING</Badge>}
            {effect.isPro && <Badge variant="pro" size="sm">PRO</Badge>}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-bg/80 backdrop-blur rounded-full text-text-primary hover:bg-primary hover:text-white transition-all group-focus-visible:ring-2 group-focus-visible:ring-primary"
            aria-label={`Generate ${effect.title}`}
          >
            <Play className="w-6 h-6" />
          </motion.button>
        </motion.div>

        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute top-3 left-3 right-3 flex items-center justify-between"
        >
          <div className="flex gap-1">
            <span className="px-2 py-1 bg-bg/80 backdrop-blur rounded-full text-xs text-text-muted">
              {effect.duration}
            </span>
            <span className="px-2 py-1 bg-bg/80 backdrop-blur rounded-full text-xs text-text-muted">
              {effect.resolution}
            </span>
          </div>
          <div className="flex gap-1">
            {effect.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-bg/80 backdrop-blur rounded-full text-xs text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
          {effect.title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2">{effect.prompt.slice(0, 120)}...</p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {effect.model}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            Generate
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}