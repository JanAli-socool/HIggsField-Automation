import { useState } from "react";
import { Eye, EyeOff, Copy, Sparkles, Zap, Film, Image as ImageIcon, Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

const promptPresets = [
  { label: "Cinematic", prompt: "Cinematic shot, 35mm film, dramatic lighting, color graded, highly detailed" },
  { label: "Action", prompt: "Dynamic action shot, motion blur, intense movement, high shutter speed" },
  { label: "Portrait", prompt: "Close-up portrait, shallow depth of field, soft lighting, detailed skin texture" },
  { label: "Landscape", prompt: "Wide landscape, golden hour, atmospheric perspective, ultra wide angle" },
  { label: "Product", prompt: "Product photography, clean background, studio lighting, commercial quality" },
  { label: "Surreal", prompt: "Surreal dreamscape, impossible geometry, ethereal lighting, Salvador Dali style" },
];

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  showRawPrompt: boolean;
  onToggleRawPrompt: () => void;
  placeholder?: string;
}

export function PromptEditor({ value, onChange, showRawPrompt, onToggleRawPrompt, placeholder }: PromptEditorProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetClick = (preset: typeof promptPresets[0]) => {
    setActivePreset(preset.label);
    onChange(value ? `${value}\n\n${preset.prompt}` : preset.prompt);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="font-medium text-text-primary">Prompt</label>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleRawPrompt} className="gap-1.5">
            {showRawPrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showRawPrompt ? "Hide Raw" : "Show Raw"}</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Describe what you want to create..."}
          className={cn(
            "w-full min-h-[120px] max-h-[300px] px-4 py-4 bg-surface border border-border rounded-xl",
            "text-text-primary placeholder-text-muted resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "font-body text-base leading-relaxed",
            "transition-all duration-200"
          )}
          rows={4}
          aria-label="Generation prompt"
        />
        <div className="absolute bottom-3 right-3 flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(value)} disabled={!value}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!showRawPrompt && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {promptPresets.map((preset) => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? "primary" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className="gap-1.5"
              >
                {preset.label === "Cinematic" && <Film className="w-3.5 h-3.5" />}
                {preset.label === "Action" && <Zap className="w-3.5 h-3.5" />}
                {preset.label === "Portrait" && <ImageIcon className="w-3.5 h-3.5" />}
                {preset.label === "Landscape" && <Sparkles className="w-3.5 h-3.5" />}
                {preset.label === "Product" && <Settings className="w-3.5 h-3.5" />}
                {preset.label === "Surreal" && <Zap className="w-3.5 h-3.5" />}
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}