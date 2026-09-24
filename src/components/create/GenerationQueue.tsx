import type { GenerationJob } from "../../types";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Clock, Eye, Download } from "lucide-react";
import { cn } from "../../lib/utils";

interface GenerationQueueProps {
  queue: GenerationJob[];
  onRemove: (id: string) => void;
  onView: (job: GenerationJob) => void;
}

const statusConfig = {
  queued: { icon: Clock, color: "text-amber-400", label: "Queued" },
  processing: { icon: Loader2, color: "text-blue-400 animate-spin", label: "Processing" },
  completed: { icon: CheckCircle, color: "text-emerald-400", label: "Completed" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
};

export function GenerationQueue({ queue, onRemove, onView }: GenerationQueueProps) {
  if (queue.length === 0) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed bottom-6 right-6 z-50 w-full max-w-md"
      role="region"
      aria-label="Generation queue"
    >
      <div className="space-y-3">
        {queue.map((job) => {
          const config = statusConfig[job.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, y: 20 }}
              className={cn(
                "bg-surface border rounded-xl p-4 shadow-elevated flex items-start gap-3",
                job.status === "completed" && "border-emerald-500/50",
                job.status === "failed" && "border-red-500/50",
                job.status === "processing" && "border-blue-500/50"
              )}
            >
              <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", config.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {job.request.mode === "template" ? "Template" : "Prompt"} Generation
                  </span>
                  <button
                    onClick={() => onRemove(job.id)}
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1 truncate">{job.request.prompt.slice(0, 80)}...</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                  {job.status === "processing" && (
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  )}
                </div>
                {job.status === "completed" && job.resultUrl && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => onView(job)} className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );
}