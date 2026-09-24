const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data.error || { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(error.code, error.message, response.status, error.details);
  }

  return data.data as T;
}

export const api = {
  generations: {
    create: (request: any) =>
      fetchApi<{ id: string; status: string; progress: number }>("/generations", {
        method: "POST",
        body: JSON.stringify(request),
      }),

    list: (params?: {
      page?: number;
      page_size?: number;
      status?: string;
      media_type?: string;
    }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", params.page.toString());
      if (params?.page_size) search.set("page_size", params.page_size.toString());
      if (params?.status) search.set("status", params.status);
      if (params?.media_type) search.set("media_type", params.media_type);
      return fetchApi<any>(`/generations?${search}`);
    },

    get: (id: string) =>
      fetchApi<any>(`/generations/${id}`),

    cancel: (id: string) =>
      fetchApi<any>(`/generations/${id}?action=cancel`, {
        method: "POST",
      }),

    retry: (id: string) =>
      fetchApi<any>(`/generations/${id}?action=retry`, {
        method: "POST",
      }),
  },

  prompt: {
    enhance: (request: any) =>
      fetchApi<any>("/prompt/enhance", {
        method: "POST",
        body: JSON.stringify(request),
      }),
  },

  workflows: {
    select: (request: any) =>
      fetchApi<any>("/workflows/select", {
        method: "POST",
        body: JSON.stringify(request),
      }),
  },

  uploads: {
    create: async (file: File, type: "image" | "video"): Promise<any> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new ApiError(data.error?.code || "UPLOAD_FAILED", data.error?.message || "Upload failed", response.status);
      }
      return data.data;
    },
  },
};

export { ApiError };