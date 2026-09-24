import { useEffect, useRef, useState, useCallback } from "react";

export function useVideoHover() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (!entry.isIntersecting) {
            video.pause();
            setIsHovered(false);
          }
        });
      },
      { threshold: 0.5, rootMargin: "50px" }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = useCallback(() => {
    const video = videoRef.current;
    if (video && isVisible) {
      video.play().catch(() => {});
      setIsHovered(true);
      setHasPlayed(true);
    }
  }, [isVisible]);

  const handleMouseLeave = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      setIsHovered(false);
    }
  }, []);

  return {
    videoRef,
    isHovered,
    isVisible,
    hasPlayed,
    handleMouseEnter,
    handleMouseLeave,
  };
}

export function useDrawer(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}