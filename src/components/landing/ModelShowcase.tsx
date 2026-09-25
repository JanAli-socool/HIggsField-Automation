import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { models, capabilityLabels, capabilityColors } from "../../data/models";
import { Badge } from "../ui/Badge";
import { Container } from "../common/Container";
import { Button } from "../ui/Button";
import { VideoPlayer } from "../ui/VideoPlayer";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const VIDEO_PLACEHOLDERS = [
  "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1190-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-forest-sunrise-1191-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-at-night-1200-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-sunset-over-mountain-landscape-1201-large.mp4",
];

function getModelVideoUrl(modelId: string): string {
  const index = Math.abs(modelId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % VIDEO_PLACEHOLDERS.length;
  return VIDEO_PLACEHOLDERS[index];
}

export function ModelShowcase() {
  return (
    <section className="py-16 lg:py-24 bg-surface/50 border-y border-border">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
            Every Top Model. One Platform.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Access 50+ leading video and image models including Sora 2, Veo 3.1, Kling 3.0, and our proprietary models.
          </p>
        </motion.div>

        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex gap-4 min-w-max"
              role="list"
            >
              {models.map((model, index) => (
                <motion.article
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex-shrink-0 w-72 sm:w-80 lg:w-96 bg-surface border border-border rounded-2xl overflow-hidden",
                    "hover:border-primary/50 transition-all duration-300",
                    "group"
                  )}
                  role="listitem"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <VideoPlayer
                      src={getModelVideoUrl(model.id)}
                      poster={model.thumbnailUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1">
                      {model.capabilities.slice(0, 3).map((cap) => (
                        <Badge
                          key={cap}
                          variant={cap as any}
                          size="sm"
                          className={cn(capabilityColors[cap], "opacity-0 group-hover:opacity-100 transition-opacity")}
                        >
                          {capabilityLabels[cap]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{model.name}</h3>
                      <p className="text-sm text-text-secondary">{model.tagline}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {model.capabilities.map((cap) => (
                        <Badge key={cap} variant={cap as any} size="sm" className={capabilityColors[cap]}>
                          {capabilityLabels[cap]}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-text-muted pt-2 border-t border-border">
                      <span className="font-medium text-text-secondary">{model.maxDuration}</span>
                      <span>•</span>
                      <span>{model.resolution}</span>
                    </div>

                    <Button variant="outline" className="w-full justify-between" asChild>
                      <Link to="/create">
                        Try Model
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg to-transparent pointer-events-none lg:block hidden" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Button variant="ghost" size="lg" asChild>
            <Link to="/apps">
              View All 50+ Models
              <ExternalLink className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}