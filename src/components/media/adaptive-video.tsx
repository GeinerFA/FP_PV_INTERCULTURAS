"use client";

import { forwardRef, useState } from "react";
import type { VideoHTMLAttributes } from "react";

type AdaptiveVideoProps = VideoHTMLAttributes<HTMLVideoElement>;

export const AdaptiveVideo = forwardRef<HTMLVideoElement, AdaptiveVideoProps>(function AdaptiveVideo(
  { className, onLoadedMetadata, src, ...props },
  ref,
) {
  const [isPortrait, setIsPortrait] = useState(false);

  return (
    <video
      {...props}
      ref={ref}
      src={src}
      className={`${className ?? ""} ${isPortrait ? "object-contain" : "object-cover"}`.trim()}
      onLoadStart={(event) => {
        setIsPortrait(false);
        props.onLoadStart?.(event);
      }}
      onLoadedMetadata={(event) => {
        setIsPortrait(event.currentTarget.videoHeight > event.currentTarget.videoWidth);
        onLoadedMetadata?.(event);
      }}
    />
  );
});
