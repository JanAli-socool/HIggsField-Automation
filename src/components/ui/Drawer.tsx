import type { ReactNode } from "react";
import { Fragment } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

type DrawerSide = "right" | "bottom";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  side?: DrawerSide;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const sideVariants = {
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
};

const sideStyles = {
  right: "h-full w-full max-w-md sm:max-w-lg lg:max-w-2xl",
  bottom: "w-full max-h-[80vh]",
};

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  side = "right",
  size = "md",
  className,
}: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={sideVariants[side].initial}
            animate={sideVariants[side].animate}
            exit={sideVariants[side].exit}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col bg-surface border-l border-border shadow-elevated",
              side === "right" ? "right-0 top-0" : "bottom-0 left-0 right-0",
              sideStyles[side],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "drawer-title" : undefined}
          >
            {(title || side === "right") && (
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 id="drawer-title" className="text-lg font-semibold text-text-primary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-border transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}