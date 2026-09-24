import type { VideoHTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref } from "react";
import { useRef, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iIzE0MTQxRSIvPgogPHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjEyIiBoZWlnaHQ9IjUiIHJ4PSIxIiBmaWxsPSIjMkEyQTMwIi8+CiA8Y2lyY2xlIGN4PSI4IiBjeT0iNC41IiByPSIxLjUiIGZpbGw9IiNBOBU1RjciIG9wYWNpdHk9IjAuMyIvPgogPHBhdGggZD0iTTcgNC41TDkgNC41TTggMy41TDggNS41IiBzdHJva2U9IiNBOBU1RjciIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";

export interface VideoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
  poster?: string;
  autoplayOnHover?: boolean;
  fallback?: string;
}

const VideoPlayer = (({ className, poster, autoplayOnHover, fallback, children, ...props }: VideoPlayerProps, ref: Ref<HTMLVideoElement | HTMLDivElement>) => {
  const internalRef = useRef<HTMLVideoElement | HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mergedRef = (el: HTMLVideoElement | HTMLDivElement | null) => {
    internalRef.current = el;
    if (ref) {
      if (typeof ref === "function") ref(el);
      else if (ref && typeof ref === "object") ref.current = el;
    }
  };

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !autoplayOnHover || video.tagName !== "VIDEO") return;

    const handleMouseEnter = () => {
      (video as HTMLVideoElement).play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const handleMouseLeave = () => {
      const v = video as HTMLVideoElement;
      v.pause();
      v.currentTime = 0;
      setIsPlaying(false);
    };

    video.addEventListener("mouseenter", handleMouseEnter);
    video.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      video.removeEventListener("mouseenter", handleMouseEnter);
      video.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [autoplayOnHover]);

  const handleError = () => {
    setHasError(true);
  };

  const handleCanPlay = () => {
    setHasError(false);
  };

  const effectivePoster = poster || fallback;
  const effectiveFallback = fallback || effectivePoster || PLACEHOLDER_SVG;

  // Show fallback if video failed to load or no video source
  if (hasError || !props.src) {
    return (
      <div
        ref={mergedRef}
        className={cn(
          "w-full h-full object-cover bg-surface flex items-center justify-center",
          className
        )}
        style={{ backgroundImage: `url(${effectiveFallback})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="text-center p-4 text-text-muted">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Video unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={mergedRef}
      className={cn(
        "w-full h-full object-cover bg-surface",
        className
      )}
      poster={effectivePoster}
      playsInline
      muted
      loop
      preload="metadata"
      onError={handleError}
      onCanPlay={handleCanPlay}
      {...props}
    >
      {children}
    </video>
  );
}) as ForwardRefExoticComponent<VideoPlayerProps & RefAttributes<HTMLVideoElement | HTMLDivElement>>;

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };