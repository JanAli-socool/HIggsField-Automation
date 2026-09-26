import { Link } from "react-router-dom";
import { ArrowRight, Zap, Award, Users, Sparkles, Settings, Film, Users as UsersIcon, Zap as ZapIcon, Check, ArrowUpRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Container } from "../components/common/Container";
import { VideoPlayer } from "../components/ui/VideoPlayer";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

const stats = [
  { value: "25M+", label: "Creators" },
  { value: "4.5M", label: "Daily Generations" },
  { value: "50+", label: "AI Models" },
  { value: "1M+", label: "Films Created" },
];

const features = [
  { icon: Film, title: "Genre & Camera Control", desc: "Pick genre, camera moves, pacing — get a finished scene, not a raw clip." },
  { icon: UsersIcon, title: "Real-time Co-directing", desc: "Multiple directors, one project. Every shot and comment lands live." },
  { icon: Sparkles, title: "AI Cast & Locations", desc: "Consistent characters and sets across every scene and angle." },
  { icon: ZapIcon, title: "Montage Pacing", desc: "Chaotic, Dynamic, Calm, or Single Shot — rhythm built in." },
  { icon: Settings, title: "Anti-Slop Pipeline", desc: "No plastic skin, no drifting faces, no AI shimmer." },
  { icon: Film, title: "Multi-Model Native", desc: "Seedance, Veo, Kling, Sora — pick engine per shot." },
];

const categories = [
  { id: "surreal", label: "Surreal", count: 5, icon: Sparkles },
  { id: "motion", label: "Motion", count: 6, icon: Zap },
  { id: "transform", label: "Transform", count: 5, icon: Settings },
  { id: "cinematic", label: "Cinematic", count: 4, icon: Film },
  { id: "character", label: "Character", count: 3, icon: Users },
];

const heroPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDEwODAiIGZpbGw9Im5vbmUiPgogPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0iIzBBMEFGRiIvPgogPHJlY3QgeD0iMjAwIiB5PSIyMDAiIHdpZHRoPSIxNTIwIiBoZWlnaHQ9IjY4MCIgcng9IjI0IiBmaWxsPSIjMTQxNDFFIiBvcGFjaXR5PSIwLjMiLz4KIDxjaXJjbGUgY3g9Ijk2MCIgY3k9IjU0MCIgcj0iMTIwIiBmaWxsPSIjQTg1NUY3IiBvcGFjaXR5PSIwLjA4Ii8+CiA8Y2lyY2xlIGN4PSI5NjAiIGN5PSI1NDAiIHI9IjgwIiBmaWxsPSIjMDZCNkQ0IiBvcGFjaXR5PSIwLjA2Ii8+CiA8Y2lyY2xlIGN4PSI5NjAiIGN5PSI1NDAiIHI9IjQwIiBmaWxsPSIjQTg1NUY3IiBvcGFjaXR5PSIwLjEyIi8+CiA8cGF0aCBkPSJNNzk2IDU0MEwxMTAwIDQ1ME05NjAgNTQwTDgyMCA2MzAiIHN0cm9rZT0iI0E4NTVGNyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuMyIvPgogPHBhdGggZD0iTTk2MCA1NDBMMTEwMCA2MzBNOTYwIDU0MCA4MjAgNDUwIiBzdHJva2U9IiMwNkI2RDQiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjMiLz4KPC9zdmc+";

export function LearningPage() {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
        <div className="absolute inset-0 z-0">
          <VideoPlayer
            src="https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4"
            poster={heroPlaceholder}
            fallback={heroPlaceholder}
            className="w-full h-full object-cover opacity-30"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/90 to-bg" />
        </div>

        <Container className="relative z-10 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex items-center justify-center gap-2"
            >
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                New: Cinema Studio 4.0
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                <Award className="w-3 h-3" />
                $1M Global Film Festival
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-text-primary leading-tight mb-6 text-balance"
            >
              Create <span className="text-primary">Anything</span> You Can Imagine
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              The AI-native creative suite for video, image, and motion design.
              50+ models. Cinematic effects. Real-time collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/auth/signin">
                  Start Creating Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto">
                <Link to="/cinema-studio">Explore Cinema Studio</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">{stat.value}</span>
                  <span className="text-text-muted">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Container>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

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
                {[
                  { id: "seedance-2-5", name: "Seedance 2.5", tagline: "The most advanced video model", tier: "pro" },
                  { id: "nano-banana-pro", name: "Nano Banana Pro", tagline: "Generate high-quality visuals", tier: "free" },
                  { id: "genjutsu", name: "Genjutsu", tagline: "Reality Manipulation", tier: "pro" },
                  { id: "cinema-studio-4", name: "Cinema Studio 4.0", tagline: "Create cinematic scenes effortlessly", tier: "enterprise" },
                  { id: "gpt-6-astra", name: "GPT-6 Astra", tagline: "Supercomputer Agent", tier: "enterprise" },
                  { id: "kling-3", name: "Kling 3.0", tagline: "Action & Motion Master", tier: "pro" },
                  { id: "veo-3-1", name: "Veo 3.1", tagline: "Cinematic Quality", tier: "pro" },
                  { id: "sora-2", name: "Sora 2", tagline: "OpenAI's Video Model", tier: "enterprise" },
                ].map((model, index) => (
                  <motion.article
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-72 sm:w-80 lg:w-96 bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group"
                    role="listitem"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="w-16 h-16 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Zap className="w-8 h-8 text-primary" />
                          </div>
                          <h4 className="font-semibold text-text-primary">{model.name}</h4>
                          <p className="text-sm text-text-secondary mt-1">{model.tagline}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{model.name}</h3>
                        <p className="text-sm text-text-secondary">{model.tagline}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-muted pt-2 border-t border-border">
                        <span className="font-medium text-text-secondary">{model.tier === "free" ? "Free" : model.tier === "pro" ? "Pro" : "Enterprise"}</span>
                        <span>•</span>
                        <span>4K</span>
                        <span className="px-2 py-0.5 bg-border rounded-full text-xs capitalize">{model.tier}</span>
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
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      <section className="py-16 lg:py-24 bg-surface/50 border-y border-border">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 lg:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
              Effects for Every Story
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              20+ cinematic effects across 5 categories. Hover to preview, click to generate.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2 mb-8 justify-center" role="tablist">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                role="tab"
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-surface text-text-secondary hover:text-text-primary hover:bg-border/50"
              >
                <category.icon className="w-4 h-4 mr-1.5" />
                {category.label} <span className="ml-1.5 text-xs text-text-muted">({category.count})</span>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
          >
            {[
              { id: "floating-fall", title: "Floating Fall", category: "surreal", model: "Seedance 2.5", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4" },
              { id: "high-flip", title: "High Flip", category: "motion", model: "Kling 3.0", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1190-large.mp4" },
              { id: "burning-man", title: "Burning Man", category: "surreal", model: "Veo 3.1", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-forest-sunrise-1191-large.mp4" },
              { id: "studio-slide", title: "Studio Slide", category: "cinematic", model: "Cinema Studio 4.0", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-at-night-1200-large.mp4" },
              { id: "incline", title: "Incline", category: "motion", model: "Sora 2", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-sunset-over-mountain-landscape-1201-large.mp4" },
              { id: "act-natural", title: "Act Natural", category: "cinematic", model: "Seedance 2.5", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4" },
            ].map((effect, index) => (
              <motion.article
                key={effect.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-video bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
                role="listitem"
              >
                <div className="relative aspect-video overflow-hidden">
                  <VideoPlayer
                    src={effect.videoUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity">{effect.category}</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{effect.title}</h3>
                    <p className="text-sm text-text-secondary">{effect.category} • {effect.model}</p>
                  </div>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link to="/create">
                      Generate with Effect
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center"
          >
            <Button variant="ghost" size="lg" asChild>
              <Link to="/effects">
                View All 20+ Effects
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

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
                  src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-at-night-1200-large.mp4"
                  poster={heroPlaceholder}
                  fallback={heroPlaceholder}
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

      <section className="py-16 lg:py-24 bg-surface/50 border-y border-border">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 lg:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Free", price: "$0", period: "/month", features: ["100 credits/month", "Standard quality", "Basic models", "Community support"], cta: "Start Free", tier: "free" },
              { name: "Creator", price: "$29", period: "/month", features: ["1,000 credits/month", "4K quality", "All models", "Priority queue", "Asset gallery"], cta: "Start Creating", tier: "pro" },
              { name: "Studio", price: "$199", period: "/month", features: ["10,000 credits/month", "4K Native", "All models + custom", "Real-time co-directing", "API access", "Dedicated support"], cta: "Contact Sales", tier: "enterprise" },
            ].map((plan, index) => (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-6 lg:p-8 bg-surface border rounded-2xl hover:border-primary/50 transition-all duration-300",
                  plan.tier === "pro" && "border-primary/50 ring-2 ring-primary/20",
                  plan.tier === "enterprise" && "border-purple-500/50 ring-2 ring-purple-500/20"
                )}
              >
                {plan.tier === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-text-secondary">{plan.features.length} features included</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-text-primary">{plan.price}</span>
                    <span className="text-text-muted">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8" role="list">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
                <Button
                  variant={plan.tier === "free" ? "ghost" : plan.tier === "pro" ? "primary" : "outline"}
                  className="w-full justify-center"
                  size="lg"
                  asChild
                >
                  <Link to="/auth/signin">{plan.cta} <ArrowRight className="w-5 h-5" /></Link>
                </Button>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24 bg-surface/50 border-y border-border">
        <Container className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-6 leading-tight">
              Ready to Create Something<br />Extraordinary?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
              Join 25M+ creators. Start with 100 free credits. No credit card required.
            </p>
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth/signin">
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>
    </>
  );
}