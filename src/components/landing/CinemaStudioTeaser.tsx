import { Link } from "react-router-dom";
import { ArrowRight, Film, Users, Sparkles, Zap, Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../common/Container";
import { VideoPlayer } from "../ui/VideoPlayer";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const features = [
  { icon: Film, title: "Genre & Camera Control", desc: "Pick genre, camera moves, pacing — get a finished scene, not a raw clip." },
  { icon: Users, title: "Real-time Co-directing", desc: "Multiple directors, one project. Every shot and comment lands live." },
  { icon: Sparkles, title: "AI Cast & Locations", desc: "Consistent characters and sets across every scene and angle." },
  { icon: Zap, title: "Montage Pacing", desc: "Chaotic, Dynamic, Calm, or Single Shot — rhythm built in." },
  { icon: Settings, title: "Anti-Slop Pipeline", desc: "No plastic skin, no drifting faces, no AI shimmer." },
  { icon: Film, title: "Multi-Model Native", desc: "Seedance, Veo, Kling, Sora — pick engine per shot." },
];

export function CinemaStudioTeaser() {
  return (
    <section className="py-16 lg:py-24 bg-surface/50 border-y border-border">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full inline-flex items-center gap-1.5 mb-4">
              <Zap className="w-3 h-3" />
              Cinema Studio 4.0
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-6 leading-tight">
              Direct AI Films.<br />Scene by Scene.
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-xl">
              A full film production inside one agent. Set genre, camera, pacing, and cast from one panel —
              and get a finished, edited scene in native 4K up to 1 minute long.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 p-4 bg-surface border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 bg-primary/20 text-primary rounded-lg flex-shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">{feature.title}</h4>
                    <p className="text-sm text-text-secondary mt-1">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button size="lg" asChild>
              <Link to="/cinema-studio">Become an AI Director</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface border border-border">
              <VideoPlayer
                src="/videos/cinema-studio-demo.webm"
                poster="/videos/cinema-studio-poster.jpg"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">LIVE DEMO</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">4K Native</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">60s Max</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-3xl font-display font-bold text-text-primary">25M+</div>
                <div className="text-sm text-text-secondary">Creators</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-3xl font-display font-bold text-text-primary">1M+</div>
                <div className="text-sm text-text-secondary">Films Made</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-xl">
                <div className="text-3xl font-display font-bold text-text-primary">50+</div>
                <div className="text-sm text-text-secondary">Models</div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}