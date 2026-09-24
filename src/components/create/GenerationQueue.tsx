import type { GenerationJob } from "../../types";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Clock, Eye, Download, X as XIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useState } from "react";
import { VideoPlayer } from "../ui/VideoPlayer";
import { Drawer } from "../ui/Drawer";

const statusConfig = {
  queued: { icon: Clock, color: "text-amber-400", label: "Queued" },
  processing: { icon: Loader2, color: "text-blue-400 animate-spin", label: "Processing" },
  completed: { icon: CheckCircle, color: "text-emerald-400", label: "Completed" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
};

function ResultViewer({ job, onClose }: { job: GenerationJob; onClose: () => void }) {
  const downloadVideo = () => {
    if (!job.resultUrl) return;
    const link = document.createElement("a");
    link.href = job.resultUrl;
    link.download = `higgsfield-${job.id}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={`Generated: ${job.request.prompt.slice(0, 50)}...`}
      side="right"
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
          <VideoPlayer
            src={job.resultUrl || "/videos/result.webm"}
            fallback="/videos/result.webm"
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button variant="ghost" size="lg" onClick={downloadVideo} className="flex-1">
              <Download className="w-5 h-5 mr-2" />
              Download Video
            </Button>
            <Button variant="primary" size="lg" onClick={onClose} className="flex-1">
              <XIcon className="w-5 h-5 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Mode</span>
            <span className="text-text-primary capitalize">{job.request.mode}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Model</span>
            <span className="text-text-primary">{job.request.modelId}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Resolution</span>
            <span className="text-text-primary">{job.request.resolution}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Aspect Ratio</span>
            <span className="text-text-primary">{job.request.aspectRatio}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Duration</span>
            <span className="text-text-primary">~5s (simulated)</span>
          </div>
          <div className="pt-3 border-t border-border text-text-muted">
            <p>This is a simulated generation. In production, this would be your AI-generated video.</p>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export function GenerationQueue({ queue, onRemove }: { queue: GenerationJob[]; onRemove: (id: string) => void }) {
  if (queue.length === 0) return null;
  const [viewJob, setViewJob] = useState<GenerationJob | null>(null);

  return (
    <>
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
                      <Button variant="ghost" size="sm" onClick={() => setViewJob(job)} className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (job.resultUrl) {
                          const link = document.createElement("a");
                          link.href = job.resultUrl;
                          link.download = `higgsfield-${job.id}.webm`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }} className="gap-1.5">
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

      <AnimatePresence>
        {viewJob && (
          <ResultViewer job={viewJob} onClose={() => setViewJob(null)} />
        )}
      </AnimatePresence>
    </>
  );
}