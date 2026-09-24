import { create } from "zustand";
import type { GenerationRequest, GenerationJob, Asset } from "../types";

interface CreateState {
  activeTab: "prompt" | "template";
  selectedEffectId: string | null;
  prompt: string;
  modelId: string;
  assets: {
    character: Asset;
    location: Asset;
    product: Asset;
  };
  resolution: "720p" | "1080p" | "4k";
  aspectRatio: "16:9" | "9:16" | "1:1";
  queue: GenerationJob[];
  isGenerating: boolean;

  setActiveTab: (tab: "prompt" | "template") => void;
  setSelectedEffectId: (id: string | null) => void;
  setPrompt: (prompt: string) => void;
  setModelId: (id: string) => void;
  setAsset: (type: "character" | "location" | "product", asset: Partial<Asset>) => void;
  setResolution: (res: "720p" | "1080p" | "4k") => void;
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  addToQueue: (job: GenerationJob) => void;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  resetForm: () => void;
}

const initialAssets = {
  character: { type: "character" as const, file: null, preview: null },
  location: { type: "location" as const, file: null, preview: null },
  product: { type: "product" as const, file: null, preview: null },
};

export const useCreateStore = create<CreateState>((set) => ({
  activeTab: "prompt",
  selectedEffectId: null,
  prompt: "",
  modelId: "seedance-2-5",
  assets: initialAssets,
  resolution: "1080p",
  aspectRatio: "16:9",
  queue: [],
  isGenerating: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedEffectId: (id) => set({ selectedEffectId: id, activeTab: "template" }),
  setPrompt: (prompt) => set({ prompt }),
  setModelId: (modelId) => set({ modelId }),
  setAsset: (type, asset) =>
    set((state) => ({
      assets: { ...state.assets, [type]: { ...state.assets[type], ...asset } },
    })),
  setResolution: (resolution) => set({ resolution }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  addToQueue: (job) =>
    set((state) => ({
      queue: [job, ...state.queue],
      isGenerating: true,
    })),
  updateJob: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((j) => (j.id === id ? { ...j, ...updates } : j)),
      isGenerating: state.queue.some((j) => j.id !== id && j.status === "processing"),
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((j) => j.id !== id),
      isGenerating: state.queue.some((j) => j.id !== id && j.status === "processing"),
    })),
  clearQueue: () => set({ queue: [], isGenerating: false }),
  resetForm: () =>
    set({
      prompt: "",
      selectedEffectId: null,
      assets: initialAssets,
      resolution: "1080p",
      aspectRatio: "16:9",
    }),
}));