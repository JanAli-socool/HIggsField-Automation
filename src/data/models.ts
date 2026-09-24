import type { Model, ModelCapability } from "../types";

const createModelPlaceholder = (hue: number, name: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" fill="none">
    <rect width="400" height="225" fill="hsl(${hue}, 30%, 12%)"/>
    <rect x="50" y="40" width="300" height="145" rx="12" fill="hsl(${hue}, 25%, 10%)" stroke="hsl(${hue}, 30%, 22%)" stroke-width="1"/>
    <circle cx="200" cy="112.5" r="32" fill="hsl(${hue}, 60%, 45%)" opacity="0.15"/>
    <text x="200" y="115" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="600" fill="hsl(${hue}, 60%, 55%)">${name}</text>
    <text x="200" y="140" text-anchor="middle" font-family="system-ui" font-size="11" fill="hsl(${hue}, 20%, 50%)">AI Video Model</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const models: Model[] = [
  {
    id: "seedance-2-5",
    name: "Seedance 2.5",
    tagline: "The most advanced video model",
    thumbnailUrl: createModelPlaceholder(270, "Seedance 2.5"),
    capabilities: ["4k", "1min", "character-consistency", "camera-control"],
    maxDuration: "60s",
    resolution: "4K",
    priceTier: "pro",
    description: "Top-tier video generation with native 4K output, up to 1-minute generations, and best-in-class character consistency across shots.",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    tagline: "Generate high-quality visuals",
    thumbnailUrl: createModelPlaceholder(180, "Nano Banana Pro"),
    capabilities: ["4k", "character-consistency", "upscale"],
    maxDuration: "10s",
    resolution: "4K",
    priceTier: "free",
    description: "High-quality image and short video generation with excellent prompt adherence and style transfer capabilities.",
  },
  {
    id: "genjutsu",
    name: "Higgsfield Genjutsu",
    tagline: "Reality Manipulation",
    thumbnailUrl: createModelPlaceholder(320, "Genjutsu"),
    capabilities: ["camera-control", "multi-model", "real-time"],
    maxDuration: "15s",
    resolution: "1080p",
    priceTier: "pro",
    description: "Transfer motion into new scenes or swap details while keeping everything else intact. Revolutionary reality manipulation.",
  },
  {
    id: "cinema-studio-4",
    name: "Cinema Studio 4.0",
    tagline: "Create cinematic scenes effortlessly",
    thumbnailUrl: createModelPlaceholder(280, "Cinema Studio 4.0"),
    capabilities: ["4k", "1min", "character-consistency", "lip-sync", "camera-control", "multi-model"],
    maxDuration: "60s",
    resolution: "4K",
    priceTier: "enterprise",
    description: "Full film production workspace: genre, camera, pacing, AI cast, co-directing, shared elements, project briefs.",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    tagline: "Supercomputer Agent",
    thumbnailUrl: createModelPlaceholder(300, "GPT-6 Astra"),
    capabilities: ["multi-model", "real-time", "camera-control"],
    maxDuration: "30s",
    resolution: "4K",
    priceTier: "enterprise",
    description: "One superagent for your entire creative stack. Market research to ad test. ChatGPT can now do motion design in After Effects.",
  },
  {
    id: "kling-3",
    name: "Kling 3.0",
    tagline: "Action & Motion Master",
    thumbnailUrl: createModelPlaceholder(200, "Kling 3.0"),
    capabilities: ["4k", "1min", "camera-control", "character-consistency"],
    maxDuration: "60s",
    resolution: "4K",
    priceTier: "pro",
    description: "Excels at complex action sequences, camera movements, and physics-based motion. Best for stunt and action content.",
  },
  {
    id: "veo-3-1",
    name: "Google Veo 3.1",
    tagline: "Cinematic Quality",
    thumbnailUrl: createModelPlaceholder(220, "Veo 3.1"),
    capabilities: ["4k", "1min", "character-consistency", "lip-sync"],
    maxDuration: "60s",
    resolution: "4K",
    priceTier: "pro",
    description: "Google's latest video model with exceptional cinematic quality, realistic physics, and precise prompt adherence.",
  },
  {
    id: "sora-2",
    name: "Sora 2",
    tagline: "OpenAI's Video Model",
    thumbnailUrl: createModelPlaceholder(240, "Sora 2"),
    capabilities: ["4k", "1min", "character-consistency", "camera-control", "multi-model"],
    maxDuration: "60s",
    resolution: "4K",
    priceTier: "enterprise",
    description: "OpenAI's flagship video model with unprecedented realism, complex scene understanding, and multi-shot consistency.",
  },
];

export const capabilityLabels: Record<ModelCapability, string> = {
  "4k": "4K",
  "1min": "1 Min",
  "character-consistency": "Character Consistency",
  "lip-sync": "Lip Sync",
  "camera-control": "Camera Control",
  "multi-model": "Multi-Model",
  "real-time": "Real-time",
  "upscale": "Upscale",
};

export const capabilityColors: Record<ModelCapability, string> = {
  "4k": "bg-purple-500/20 text-purple-400",
  "1min": "bg-blue-500/20 text-blue-400",
  "character-consistency": "bg-emerald-500/20 text-emerald-400",
  "lip-sync": "bg-pink-500/20 text-pink-400",
  "camera-control": "bg-amber-500/20 text-amber-400",
  "multi-model": "bg-cyan-500/20 text-cyan-400",
  "real-time": "bg-orange-500/20 text-orange-400",
  "upscale": "bg-indigo-500/20 text-indigo-400",
};