import { models, capabilityLabels, capabilityColors } from "../../data/models";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { X, Check } from "lucide-react";

interface ModelPickerProps {
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export function ModelPicker({ selectedModelId, onSelect, onClose }: ModelPickerProps) {
  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Select Model"
      side="right"
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search models..."
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search models"
          />
          <button className="px-3 py-2 bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-border transition-colors" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {models.map((model) => (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: models.indexOf(model) * 0.03 }}
              onClick={() => { onSelect(model.id); onClose(); }}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all duration-200",
                selectedModelId === model.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-surface"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-10 bg-surface rounded-lg overflow-hidden flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-text-primary truncate">{model.name}</h4>
                    {selectedModelId === model.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-text-secondary mt-1 truncate">{model.tagline}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {model.capabilities.map((cap) => (
                      <Badge key={cap} variant={cap as any} size="sm" className={capabilityColors[cap]}>
                        {capabilityLabels[cap]}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted mt-3">
                    <span>{model.maxDuration}</span>
                    <span>•</span>
                    <span>{model.resolution}</span>
                    <span className="px-2 py-0.5 bg-border rounded-full text-xs capitalize">{model.priceTier}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <Button variant="ghost" className="w-full justify-center" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Drawer>
  );
}