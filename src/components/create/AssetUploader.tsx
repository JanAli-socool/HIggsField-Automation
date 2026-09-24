import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image, Video, CheckCircle } from "lucide-react";
import type { Asset } from "../../types";
import { cn } from "../../lib/utils";

interface AssetUploaderProps {
  assets: {
    character: Asset;
    location: Asset;
    product: Asset;
  };
  onAssetChange: (type: "character" | "location" | "product", asset: Partial<Asset>) => void;
}

const assetConfig = {
  character: { label: "Character", icon: Image, accept: "image/*", description: "Upload a character reference image" },
  location: { label: "Location", icon: Image, accept: "image/*", description: "Upload a location/background image" },
  product: { label: "Product", icon: Image, accept: "image/*", description: "Upload a product image" },
} as const;

export function AssetUploader({ assets, onAssetChange }: AssetUploaderProps) {
  const [dragActive, setDragActive] = useState<"character" | "location" | "product" | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>, type: "character" | "location" | "product") => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, type: "character" | "location" | "product") => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAssetChange(type, { file, preview: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [onAssetChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: "character" | "location" | "product") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAssetChange(type, { file, preview: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  }, [onAssetChange]);

  const handleRemove = useCallback((type: "character" | "location" | "product") => {
    onAssetChange(type, { file: null, preview: null });
  }, [onAssetChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(["character", "location", "product"] as const).map((type) => {
        const config = assetConfig[type];
        const asset = assets[type];
        const isActive = dragActive === type;
        const hasFile = !!asset.file || !!asset.preview;

        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative rounded-xl border-2 transition-all duration-200",
              hasFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-border",
              isActive && "border-primary bg-primary/5"
            )}
            onDragEnter={(e) => handleDrag(e, type)}
            onDragOver={(e) => handleDrag(e, type)}
            onDragLeave={(e) => handleDrag(e, type)}
            onDrop={(e) => handleDrop(e, type)}
          >
            <input
              type="file"
              accept={config.accept}
              onChange={(e) => handleFileSelect(e, type)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id={`asset-${type}`}
              disabled={hasFile}
              aria-label={config.description}
            />

            {hasFile && asset.preview ? (
              <div className="aspect-[9/16] relative overflow-hidden rounded-lg">
                <img
                  src={asset.preview}
                  alt={config.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 text-sm font-medium text-text-primary truncate">
                      {asset.file?.name || "Uploaded"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(type); }}
                      className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                      aria-label={`Remove ${config.label}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Ready
                  </span>
                </div>
              </div>
            ) : (
              <label
                htmlFor={`asset-${type}`}
                className={cn(
                  "flex flex-col items-center justify-center aspect-[9/16] p-6 text-center cursor-pointer",
                  "hover:bg-surface transition-colors"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                  isActive ? "bg-primary/20 text-primary" : "bg-surface border border-border text-text-muted"
                )}>
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-medium text-text-primary">{config.label}</span>
                <p className="text-sm text-text-muted mt-1">{config.description}</p>
                <p className="text-xs text-text-muted mt-2">Drag & drop or click to upload</p>
              </label>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}