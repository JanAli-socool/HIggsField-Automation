import { Link } from "react-router-dom";
import { ArrowRight, Play, Zap } from "lucide-react";
import { effects, featuredEffects } from "../../data/effects";
import { Badge } from "../ui/Badge";
import { Container } from "../common/Container";
import { Button } from "../ui/Button";
import { VideoPlayer } from "../ui/VideoPlayer";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function EffectsPreview() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-2">
              Visual Effects
            </h2>
            <p className="text-lg text-text-secondary max-w-xl">
              Cinematic AI effects — choose a template, add your media, generate in seconds.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/effects">
              View All Effects
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredEffects.map((effect, index) => (
            <motion.article
              key={effect.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="relative aspect-[9/16] overflow-hidden">
                <VideoPlayer
                  src={effect.videoUrl}
                  poster={effect.thumbnailUrl}
                  autoplayOnHover
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-1">
                    {effect.isNew && <Badge variant="new" size="sm">NEW</Badge>}
                    {effect.isTrending && <Badge variant="trending" size="sm">TRENDING</Badge>}
                    {effect.isPro && <Badge variant="pro" size="sm">PRO</Badge>}
                  </div>
                  <button
                    className="p-2 bg-bg/80 backdrop-blur rounded-full text-text-primary hover:bg-primary hover:text-white transition-all"
                    aria-label={`Generate ${effect.title}`}
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>{effect.duration}</span>
                  <span>{effect.resolution}</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {effect.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2">{effect.prompt.slice(0, 100)}...</p>
                <div className="flex flex-wrap gap-1">
                  {effect.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/effects">
              Explore All {effects.length} Effects
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}