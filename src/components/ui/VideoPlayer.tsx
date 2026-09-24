import type { VideoHTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref } from "react";
import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface VideoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
  poster?: string;
  autoplayOnHover?: boolean;
}

const VideoPlayer = (({ className, poster, autoplayOnHover, children, ...props }: VideoPlayerProps, ref: Ref<HTMLVideoElement>) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const mergedRef = (el: HTMLVideoElement | null) => {
    internalRef.current = el;
    if (ref) {
      if (typeof ref === "function") ref(el);
      else if (ref && typeof ref === "object") ref.current = el;
    }
  };

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !autoplayOnHover) return;

    const handleMouseEnter = () => {
      video.play().catch(() => {});
    };

    const handleMouseLeave = () => {
      video.pause();
      video.currentTime = 0;
    };

    video.addEventListener("mouseenter", handleMouseEnter);
    video.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      video.removeEventListener("mouseenter", handleMouseEnter);
      video.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [autoplayOnHover]);

  return (
    <video
      ref={mergedRef}
      className={cn(
        "w-full h-full object-cover bg-surface",
        className
      )}
      poster={poster}
      playsInline
      muted
      loop
      preload="metadata"
      {...props}
    >
      {children}
    </video>
  );
}) as ForwardRefExoticComponent<VideoPlayerProps & RefAttributes<HTMLVideoElement>>;

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };