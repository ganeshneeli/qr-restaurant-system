import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
  cdnUrl?: string;
  localPath?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  poster?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  className,
  cdnUrl = "https://ik.imagekit.io/w3msiyg469/dashboard-video.mp4",
  localPath = "/assets/dashboard-video.mp4",
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  poster,
}) => {
  const [useLocal, setUseLocal] = useState(false);

  const handleError = () => {
    console.warn(`VideoBackground: CDN source failed to load, falling back to local asset: ${localPath}`);
    setUseLocal(true);
  };

  return (
    <video
      className={cn("w-full h-full object-cover", className)}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      poster={poster}
      onError={handleError}
    >
      {/* If fallback has triggered, only show local. Otherwise try CDN first. */}
      {useLocal ? (
        <source src={localPath} type="video/mp4" />
      ) : (
        <>
          <source src={cdnUrl} type="video/mp4" onError={handleError} />
          <source src={localPath} type="video/mp4" />
        </>
      )}
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
