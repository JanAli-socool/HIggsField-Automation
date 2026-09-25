import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Award, Users } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../common/Container";
import { VideoPlayer } from "../ui/VideoPlayer";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const stats = [
  { value: "25M+", label: "Creators" },
  { value: "4.5M", label: "Daily Generations" },
  { value: "50+", label: "AI Models" },
  { value: "1M+", label: "Films Created" },
];

// Hero background - using external video URL
const heroVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4";
const heroPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDEwODAiIGZpbGw9Im5vbmUiPgogPHJlY3Qgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0iIzBBMEFGRiIvPgogPHJlY3QgeD0iMjAwIiB5PSIyMDAiIHdpZHRoPSIxNTIwIiBoZWlnaHQ9IjY4MCIgcng9IjI0IiBmaWxsPSIjMTQxNDFFIiBvcGFjaXR5PSIwLjMiLz4KIDxjaXJjbGUgY3g9Ijk2MCIgY3k9IjU0MCIgcj0iMTIwIiBmaWxsPSIjQTg1NUY3IiBvcGFjaXR5PSIwLjA4Ii8+CiA8Y2lyY2xlIGN4PSI5NjAiIGN5PSI1NDAiIHI9IjgwIiBmaWxsPSIjMDZCNkQ0IiBvcGFjaXR5PSIwLjA2Ii8+CiA8Y2lyY2xlIGN4PSI5NjAiIGN5PSI1NDAiIHI9IjQwIiBmaWxsPSIjQTg1NUY3IiBvcGFjaXR5PSIwLjEyIi8+CiA8cGF0aCBkPSJNNzk2IDU0MEwxMTAwIDQ1ME05NjAgNTQwTDgyMCA2MzAiIHN0cm9rZT0iI0E4NTVGNyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuMyIvPgogPHBhdGggZD0iTTk2MCA1NDBMMTEwMCA2MzBNOTYwIDU0MCA4MjAgNDUwIiBzdHJva2U9IiMwNkI2RDQiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjMiLz4KPC9zdmc+";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
      <div className="absolute inset-0 z-0">
        <VideoPlayer
          src={heroVideoUrl}
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
              <Link to="/create">
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
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl sm:text-3xl font-display font-bold text-text-primary">{stat.value}</span>
                <span className="text-text-muted">{stat.label}</span>
              </div>
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
  );
}