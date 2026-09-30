import { create } from "zustand";
import type { GenerationRequest, GenerationJob, Asset, EnhancePromptResponse, WorkflowSelectResponse } from "@/types";
import { api, ApiError } from "@/lib/api/client";

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
  projectId: string | undefined;
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

function getInitialState() {
  return {
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
    projectId: undefined,
    debounceTimer: null as ReturnType<typeof setTimeout> | null,
    activeTab: "prompt" as const,
    selectedEffectId: null,
    prompt: "",
    assets: {
      character: { type: "character" as const, file: null, preview: null, url: null },
      location: { type: "location" as const, file: null, preview: null, url: null },
      product: { type: "product" as const, file: null, preview: null, url: null },
    },
    queue: [] as GenerationJob[],
    isGenerating: false,
    error: null,
    isPolling: false,
    enhancedPrompt: null,
    workflowRecommendation: null,
    isEnhancing: false,
    isDetectingWorkflow: false,
  };
}

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

function createSlice(set: any, get: any) {
  const initial = getInitialState();

  function setActiveTab(tab: "prompt" | "template") {
    set({ activeTab: tab });
  }

  function setSelectedEffectId(id: string | null) {
    set({ selectedEffectId: id, activeTab: "template" });
  }

  function setPrompt(prompt: string) {
    set({ prompt });
    get().debouncedDetectWorkflow();
  }

  function setModelId(modelId: string) {
    set({ modelId });
  }

  function setAsset(type: "character" | "location" | "product", asset: any) {
    set((state: any) => ({
      assets: { ...state.assets, [type]: { ...state.assets[type], ...asset } },
    }));
  }

  function setResolution(resolution: "720p" | "1080p" | "4k") {
    set({ resolution });
  }

  function setAspectRatio(aspectRatio: "16:9" | "9:16" | "1:1") {
    set({ aspectRatio });
  }

  function setQuality(quality: "preview" | "standard" | "high") {
    set({ quality });
  }

  function setSteps(steps: number) {
    set({ steps });
  }

  function setGuidanceScale(guidanceScale: number) {
    set({ guidanceScale });
  }

  function setSeed(seed: number | null) {
    set({ seed });
  }

  function setStrength(strength: number) {
    set({ strength });
  }

  function setDurationSeconds(durationSeconds: number) {
    set({ durationSeconds });
  }

  function setFps(fps: number) {
    set({ fps });
  }

  function setMotionStrength(motionStrength: number) {
    set({ motionStrength });
  }

  function setCameraMotion(cameraMotion: string) {
    set({ cameraMotion });
  }

  function setNumOutputs(numOutputs: number) {
    set({ numOutputs });
  }

  function setError(error: string | null) {
    set({ error });
  }

  function addToQueue(job: any) {
    set((state: any) => ({
      queue: [job, ...state.queue],
      isGenerating: true,
    }));
  }

  function updateJob(id: string, updates: Partial<any>) {
    set((state: any) => ({
      queue: state.queue.map((j: any) => (j.id === id ? { ...j, ...updates } : j)),
      isGenerating: state.queue.some((j: any) => j.id !== id && ["queued", "processing"].includes(j.status)),
    }));
  }

  function removeFromQueue(id: string) {
    set((state: any) => ({
      queue: state.queue.filter((j: any) => j.id !== id),
      isGenerating: state.queue.some((j: any) => j.id !== id && ["queued", "processing"].includes(j.status)),
    }));
  }

  function clearQueue() {
    set({ queue: [], isGenerating: false });
  }

  function resetForm() {
    set(getInitialState());
  }

  async function uploadAsset(type: "character" | "location" | "product", file: File) {
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
  }

  async function generate(mode: "prompt" | "template", effectId?: string) {
    const state = get();
    if (mode === "prompt" && !state.prompt.trim()) {
      set({ error: "Please enter a prompt" });
      return;
    }

    set({ error: null, isGenerating: true });

    try {
      const parameters = buildParameters(mode, state, effectId);
      const request: GenerationRequest = {
        project_id: state.projectId,
        parameters,
      };

      const response = await api.generations.create(request);

      const newJob: GenerationJob = {
        id: response.id,
        user_id: "current_user",
        project_id: state.projectId,
        media_type: parameters.media_type,
        model: parameters.model,
        original_prompt: state.prompt,
        enhanced_prompt: "",
        negative_prompt: "",
        status: "queued",
        progress: 0,
        input_asset_url: state.assets.character.url || null,
        mask_url: null,
        first_frame_image_url: state.assets.location.url || null,
        last_frame_image_url: state.assets.product.url || null,
        output_asset_urls: [],
        thumbnail_urls: [],
        parameters,
        provider_job_id: null,
        credit_cost: 0,
        error_message: null,
        failure_type: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
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
  }

  async function cancelJob(id: string) {
    try {
      await api.generations.cancel(id);
      set((state: any) => ({
        queue: state.queue.map((j: any) =>
          j.id === id ? { ...j, status: "cancelled" } : j
        ),
      }));
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  }

  async function retryJob(id: string) {
    try {
      const response = await api.generations.retry(id);
      const newJob: GenerationJob = {
        id: response.id,
        user_id: "current_user",
        project_id: null,
        media_type: "text_to_video",
        model: "wan21",
        original_prompt: "",
        enhanced_prompt: "",
        negative_prompt: "",
        status: "queued",
        progress: 0,
        input_asset_url: null,
        mask_url: null,
        first_frame_image_url: null,
        last_frame_image_url: null,
        output_asset_urls: [],
        thumbnail_urls: [],
        parameters: {} as any,
        provider_job_id: null,
        credit_cost: 0,
        error_message: null,
        failure_type: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      set((state: any) => ({ queue: [newJob, ...state.queue] }));
      get().startPolling(response.id);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }

  function startPolling(jobId: string) {
    set({ isPolling: true });

    const poll = async () => {
      try {
        const job = await api.generations.get(jobId);
        set((state: any) => ({
          queue: state.queue.map((j: any) =>
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
  }

  function stopPolling() {
    set({ isPolling: false });
  }

  async function enhancePrompt() {
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
  }

  function applyEnhancedPrompt() {
    const state = get();
    if (state.enhancedPrompt) {
      set({ prompt: state.enhancedPrompt.enhanced_prompt });
    }
  }

  async function detectWorkflow() {
    const state = get();
    if (!state.prompt.trim() || state.prompt.trim().length < 3) {
      set({ workflowRecommendation: null });
      return;
    }

    set({ isDetectingWorkflow: true });

    try {
      const hasCharacterAsset = !!state.assets.character.url;

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
  }

  function clearEnhancement() {
    set({ enhancedPrompt: null, workflowRecommendation: null });
  }

  function debouncedDetectWorkflow() {
    const state = get();
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    const timer = setTimeout(() => {
      get().detectWorkflow();
    }, 500);
    set({ debounceTimer: timer });
  }

  return {
    ...initial,
    setActiveTab,
    setSelectedEffectId,
    setPrompt,
    setModelId,
    setAsset,
    setResolution,
    setAspectRatio,
    setQuality,
    setSteps,
    setGuidanceScale,
    setSeed,
    setStrength,
    setDurationSeconds,
    setFps,
    setMotionStrength,
    setCameraMotion,
    setNumOutputs,
    setError,
    addToQueue,
    updateJob,
    removeFromQueue,
    clearQueue,
    resetForm,
    uploadAsset,
    generate,
    cancelJob,
    retryJob,
    startPolling,
    stopPolling,
    enhancePrompt,
    applyEnhancedPrompt,
    detectWorkflow,
    clearEnhancement,
    debouncedDetectWorkflow,
  };
}

export const useCreateStore = create<CreateState>()(createSlice);