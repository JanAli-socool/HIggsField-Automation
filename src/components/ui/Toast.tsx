import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/50 bg-red-500/10 text-red-400",
  info: "border-blue-500/50 bg-blue-500/10 text-blue-400",
};

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 20 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-elevated",
        "max-w-sm w-full backdrop-blur-sm",
        colors[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="p-1 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToasterProps {
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
  onDismiss: (id: string) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  );
}