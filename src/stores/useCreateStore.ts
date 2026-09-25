import { create } from "zustand";
import type { GenerationRequest, GenerationJob, Asset, EnhancePromptResponse, WorkflowSelectResponse } from "../types";
import { api, ApiError } from "../lib/api/client";

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
  quality: "preview" | "standard" | "high";
  steps: number;
  guidanceScale: number;
  seed: number | null;
  strength: number;
  durationSeconds: number;
  fps: number;
  motionStrength: number;
  cameraMotion: string;
  numOutputs: number;
  queue: GenerationJob[];
  isGenerating: boolean;
  error: string | null;
  isPolling: boolean;

  enhancedPrompt: EnhancePromptResponse | null;
  workflowRecommendation: WorkflowSelectResponse | null;
  isEnhancing: boolean;
  isDetectingWorkflow: boolean;

  setActiveTab: (tab: "prompt" | "template") => void;
  setSelectedEffectId: (id: string | null) => void;
  setPrompt: (prompt: string) => void;
  setModelId: (id: string) => void;
  setAsset: (type: "character" | "location" | "product", asset: Partial<Asset>) => void;
  setResolution: (res: "720p" | "1080p" | "4k") => void;
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  setQuality: (quality: "preview" | "standard" | "high") => void;
  setSteps: (steps: number) => void;
  setGuidanceScale: (scale: number) => void;
  setSeed: (seed: number | null) => void;
  setStrength: (strength: number) => void;
  setDurationSeconds: (seconds: number) => void;
  setFps: (fps: number) => void;
  setMotionStrength: (strength: number) => void;
  setCameraMotion: (motion: string) => void;
  setNumOutputs: (count: number) => void;
  setError: (error: string | null) => void;
  addToQueue: (job: GenerationJob) => void;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  resetForm: () => void;
  generate: (mode: "prompt" | "template", effectId?: string) => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  uploadAsset: (type: "character" | "location" | "product", file: File) => Promise<string>;
  enhancePrompt: () => Promise<void>;
  applyEnhancedPrompt: () => void;
  detectWorkflow: () => Promise<void>;
  clearEnhancement: () => void;
}

const initialAssets = {
  character: { type: "character" as const, file: null, preview: null, url: null },
  location: { type: "location" as const, file: null, preview: null, url: null },
  product: { type: "product" as const, file: null, preview: null, url: null },
};

const defaultParams = {
  modelId: "wan21",
  resolution: "1080p" as const,
  aspectRatio: "16:9" as const,
  quality: "standard" as const,
  steps: 28,
  guidanceScale: 5,
  seed: null as number | null,
  strength: 0.75,
  durationSeconds: 5,
  fps: 24,
  motionStrength: 0.6,
  cameraMotion: "none",
  numOutputs: 1,
  debounceTimer: null as ReturnType<typeof setTimeout> | null,
};

function resolutionToDimensions(resolution: string, aspectRatio: string): { width: number; height: number } {
  const ratios: Record<string, [number, number]> = {
    "16:9": [16, 9],
    "9:16": [9, 16],
    "1:1": [1, 1],
    "4:3": [4, 3],
    "3:4": [3, 4],
    "21:9": [21, 9],
  };

  const baseResolutions: Record<string, number> = {
    "720p": 720,
    "1080p": 1080,
    "4k": 2160,
  };

  const base = baseResolutions[resolution] || 1080;
  const [w, h] = ratios[aspectRatio] || [16, 9];
  const width = Math.round(base * (w / h));
  const height = base;

  return { width, height };
}

function buildParameters(
  mode: "prompt" | "template",
  state: any,
  effectId?: string
): any {
  const { width, height } = resolutionToDimensions(state.resolution, state.aspectRatio);

  const baseParams: any = {
    media_type: mode === "template" ? "image_to_video" : "text_to_video",
    model: state.modelId,
    prompt: state.prompt,
    negative_prompt: "",
    width,
    height,
    aspect_ratio: state.aspectRatio,
    num_outputs: state.numOutputs,
    steps: state.steps,
    guidance_scale: state.guidanceScale,
    seed: state.seed || undefined,
    quality: state.quality,
    duration_seconds: state.durationSeconds,
    fps: state.fps,
    motion_strength: state.motionStrength,
    camera_motion: state.cameraMotion,
  };

  if (mode === "template" && effectId) {
    // Effect prompt would be merged here
  }

  if (state.assets.character.url) (baseParams as any).input_image_url = state.assets.character.url;
  if (state.assets.location.url) (baseParams as any).first_frame_image_url = state.assets.location.url;
  if (state.assets.product.url) (baseParams as any).last_frame_image_url = state.assets.product.url;

  return baseParams;
}

const storeCreator = (set: any, get: any) => ({
  ...defaultParams,
  activeTab: "prompt",
  selectedEffectId: null,
  prompt: "",
  assets: {
    character: { type: "character" as const, file: null, preview: null, url: null },
    location: { type: "location" as const, file: null, preview: null, url: null },
    product: { type: "product" as const, file: null, preview: null, url: null },
  },
  queue: [],
  isGenerating: false,
  error: null,
  isPolling: false,

  enhancedPrompt: null,
  workflowRecommendation: null,
  isEnhancing: false,
  isDetectingWorkflow: false,

  setActiveTab: (tab: "prompt" | "template") => set({ activeTab: tab }),
  setSelectedEffectId: (id: string | null) => set({ selectedEffectId: id, activeTab: "template" }),
  setPrompt: (prompt: string) => {
    set({ prompt });
    get().debouncedDetectWorkflow();
  },
  setModelId: (modelId: string) => set({ modelId }),
  setAsset: (type: "character" | "location" | "product", asset: Partial<any>) =>
    set((state: any) => ({
      assets: { ...state.assets, [type]: { ...state.assets[type], ...asset } },
    })),
  setResolution: (resolution: "720p" | "1080p" | "4k") => set({ resolution }),
  setAspectRatio: (aspectRatio: "16:9" | "9:16" | "1:1") => set({ aspectRatio }),
  setQuality: (quality: "preview" | "standard" | "high") => set({ quality }),
  setSteps: (steps: number) => set({ steps }),
  setGuidanceScale: (guidanceScale: number) => set({ guidanceScale }),
  setSeed: (seed: number | null) => set({ seed }),
  setStrength: (strength: number) => set({ strength }),
  setDurationSeconds: (durationSeconds: number) => set({ durationSeconds }),
  setFps: (fps: number) => set({ fps }),
  setMotionStrength: (motionStrength: number) => set({ motionStrength }),
  setCameraMotion: (cameraMotion: string) => set({ cameraMotion }),
  setNumOutputs: (numOutputs: number) => set({ numOutputs }),
  setError: (error: string | null) => set({ error }),

  addToQueue: (job: GenerationJob) =>
    set((state: any) => ({
      queue: [job, ...state.queue],
      isGenerating: true,
    })),

  updateJob: (id: string, updates: Partial<GenerationJob>) =>
    set((state: any) => ({
      queue: state.queue.map((j: GenerationJob) => (j.id === id ? { ...j, ...updates } : j)),
      isGenerating: state.queue.some((j: GenerationJob) => j.id !== id && ["queued", "processing"].includes(j.status)),
    })),

  removeFromQueue: (id: string) =>
    set((state: any) => ({
      queue: state.queue.filter((j: GenerationJob) => j.id !== id),
      isGenerating: state.queue.some((j: GenerationJob) => j.id !== id && ["queued", "processing"].includes(j.status)),
    })),

  clearQueue: () => set({ queue: [], isGenerating: false }),

  resetForm: () =>
    set({
      prompt: "",
      selectedEffectId: null,
      assets: {
        character: { type: "character" as const, file: null, preview: null, url: null },
        location: { type: "location" as const, file: null, preview: null, url: null },
        product: { type: "product" as const, file: null, preview: null, url: null },
      },
      error: null,
      enhancedPrompt: null,
      workflowRecommendation: null,
      ...defaultParams,
    }),

  uploadAsset: async (type: "character" | "location" | "product", file: File) => {
    try {
      const response = await api.uploads.create(file, "image");
      set((state: any) => ({
        assets: {
          ...state.assets,
          [type]: { ...state.assets[type], file, preview: response.url, url: response.url },
        },
      }));
      return response.url;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  generate: async (mode: "prompt" | "template", effectId?: string) => {
    const state = get();
    if (mode === "prompt" && !state.prompt.trim()) {
      set({ error: "Please enter a prompt" });
      return;
    }

    set({ error: null, isGenerating: true });

    try {
      const parameters = buildParameters(mode, state, effectId);
      const request: GenerationRequest = {
        mode,
        prompt: state.prompt,
        modelId: state.modelId,
        assets: state.assets,
        resolution: state.resolution,
        aspectRatio: state.aspectRatio,
        parameters,
        projectId: undefined,
      };

      const response = await api.generations.create(request);

      const newJob: GenerationJob = {
        id: response.id,
        userId: "current_user",
        projectId: undefined,
        status: "queued",
        progress: 0,
        request,
        resultUrls: [],
        thumbnailUrls: [],
        createdAt: new Date().toISOString(),
      };

      set((state: any) => ({
        queue: [newJob, ...state.queue],
        isGenerating: true,
        error: null,
      }));

      get().startPolling(response.id);
    } catch (error) {
      if (error instanceof ApiError) {
        set({ error: error.message, isGenerating: false });
      } else {
        set({ error: "Generation failed. Please try again.", isGenerating: false });
      }
    }
  },

  cancelJob: async (id: string) => {
    try {
      await api.generations.cancel(id);
      set((state: any) => ({
        queue: state.queue.map((j: GenerationJob) =>
          j.id === id ? { ...j, status: "cancelled" } : j
        ),
      }));
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  },

  retryJob: async (id: string) => {
    try {
      const response = await api.generations.retry(id);
      const newJob: GenerationJob = {
        id: response.id,
        userId: "current_user",
        projectId: undefined,
        status: "queued",
        progress: 0,
        request: { parameters: {} } as any,
        resultUrls: [],
        thumbnailUrls: [],
        createdAt: new Date().toISOString(),
      };
      set((state: any) => ({ queue: [newJob, ...state.queue] }));
      get().startPolling(response.id);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  },

  startPolling: (jobId: string) => {
    set({ isPolling: true });

    const poll = async () => {
      try {
        const job = await api.generations.get(jobId);
        set((state: any) => ({
          queue: state.queue.map((j: GenerationJob) =>
            j.id === jobId ? { ...j, ...job } : j
          ),
        }));

        if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
          get().stopPolling();
        } else {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        setTimeout(poll, 5000);
      }
    };

    poll();
  },

  stopPolling: () => set({ isPolling: false }),

  enhancePrompt: async () => {
    const state = get();
    if (!state.prompt.trim()) return;

    set({ isEnhancing: true, error: null });

    try {
      const mediaType = state.workflowRecommendation?.media_type || "text_to_video";
      const response = await api.prompt.enhance({
        prompt: state.prompt,
        media_type: mediaType,
      });

      set({
        enhancedPrompt: response,
        isEnhancing: false,
      });

      if (response.model_recommendation) {
        set({ modelId: response.model_recommendation });
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      set({ isEnhancing: false, error: "Failed to enhance prompt" });
    }
  },

  applyEnhancedPrompt: () => {
    const state = get();
    if (state.enhancedPrompt) {
      set({ prompt: state.enhancedPrompt.enhanced_prompt });
    }
  },

  detectWorkflow: async () => {
    const state = get();
    if (!state.prompt.trim() || state.prompt.trim().length < 3) {
      set({ workflowRecommendation: null });
      return;
    }

    set({ isDetectingWorkflow: true });

    try {
      const hasCharacterAsset = !!state.assets.character.url;
      const hasLocationAsset = !!state.assets.location.url;
      const hasProductAsset = !!state.assets.product.url;

      const response = await api.workflows.select({
        prompt: state.prompt,
        input_image_url: hasCharacterAsset ? state.assets.character.url : undefined,
        mask_url: undefined,
      });

      set({
        workflowRecommendation: response,
        isDetectingWorkflow: false,
      });

      if (response.recommended_model && !state.enhancedPrompt) {
        set({ modelId: response.recommended_model });
      }
    } catch (error) {
      console.error("Workflow detection failed:", error);
      set({ isDetectingWorkflow: false });
    }
  },

  clearEnhancement: () => {
    set({ enhancedPrompt: null, workflowRecommendation: null });
  },

  debouncedDetectWorkflow: () => {
    const state = get();
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    const timer = setTimeout(() => {
      get().detectWorkflow();
    }, 500);
    set({ debounceTimer: timer });
  },
});

export const useCreateStore = create<any>(storeCreator);