declare const process: { env: Record<string, string | undefined> } | undefined;
declare const importMeta: { env: Record<string, string | undefined> } | undefined;

function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env[key];
  }
  if (typeof importMeta !== "undefined" && importMeta?.env) {
    return importMeta.env[key];
  }
  return undefined;
}

export const env = {
  REPLICATE_API_TOKEN: getEnv("REPLICATE_API_TOKEN") || getEnv("NEXT_PUBLIC_REPLICATE_API_TOKEN") || "",
  REPLICATE_API_BASE: getEnv("REPLICATE_API_BASE") || "https://api.replicate.com/v1",
  NEXT_PUBLIC_APP_URL: getEnv("NEXT_PUBLIC_APP_URL") || "",
};