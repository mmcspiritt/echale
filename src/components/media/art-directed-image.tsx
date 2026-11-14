"use client";

import { getImageProps } from "next/image";
import { useId } from "react";

import { WARM_BLUR_DATA_URL } from "@/lib/utils";

export function ArtDirectedImage({
  mobileSrc,
  desktopSrc,
  alt,
  priority = false,
  mobileObjectPosition = "50% 50%",
  desktopObjectPosition = "50% 50%",
  mobileSizes,
  desktopSizes,
  className,
  mobileBlurDataURL = WARM_BLUR_DATA_URL,
  desktopBlurDataURL = WARM_BLUR_DATA_URL,
}: {
  mobileSrc: string;
  desktopSrc: string;
  alt: string;
  priority?: boolean;
  mobileObjectPosition?: string;
  desktopObjectPosition?: string;
  mobileSizes: string;
  desktopSizes: string;
  className?: string;
  mobileBlurDataURL?: string;
  desktopBlurDataURL?: string;
}) {
  const classId = `art-${useId().replace(/:/g, "")}`;
  const { props: desktopProps } = getImageProps({
    alt,
    src: desktopSrc,
    width: 1500,
    height: 1000,
    sizes: desktopSizes,
    placeholder: "blur",
    blurDataURL: desktopBlurDataURL,
  });
  const { props: mobileProps } = getImageProps({
    alt,
    src: mobileSrc,
    width: 1000,
    height: 1250,
    sizes: mobileSizes,
    placeholder: "blur",
    blurDataURL: mobileBlurDataURL,
  });
  const { srcSet: desktopSrcSet } = desktopProps;
  const { style: mobileStyle, ...mobileRest } = mobileProps;

  return (
    <>
      <style>{`
        .${classId} { object-position: ${mobileObjectPosition}; }
        @media (min-width: 768px) {
          .${classId} { object-position: ${desktopObjectPosition}; }
        }
      `}</style>
      <picture className="absolute inset-0 block h-full w-full">
        {desktopSrc !== mobileSrc ? (
          <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
        ) : null}
        {/* next/image art direction renders one img; the source picks the other crop. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...mobileRest}
          alt={alt}
          loading={priority ? "eager" : mobileRest.loading}
          fetchPriority={priority ? "high" : mobileRest.fetchPriority}
          className={`${classId} h-full w-full object-cover ${className ?? ""}`}
          style={{
            ...mobileStyle,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </picture>
    </>
  );
}
