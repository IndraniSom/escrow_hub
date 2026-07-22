"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function GlobePulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener("resize", onResize);
    onResize();

    const options: any = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.15,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.11, 0.11, 0.12], // Match #111113 ish
      markerColor: [0.917, 0.345, 0.047], // #ea580c (Orange 600)
      glowColor: [0.05, 0.05, 0.05], // Very dark glow
      markers: [
        { location: [37.7749, -122.4194], size: 0.05 }, // SF
        { location: [40.7128, -74.0060], size: 0.05 }, // NY
        { location: [51.5074, -0.1278], size: 0.05 }, // London
        { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
        { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
        { location: [1.3521, 103.8198], size: 0.05 }, // Singapore
      ],
      onRender: (state: any) => {
        state.phi = phi;
        phi += 0.003;
      },
    };
    
    const globe = createGlobe(canvasRef.current!, options);

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    }, 100);

    return () => {
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, []);

  return (
    <div className="w-full max-w-[500px] aspect-square relative mx-auto flex items-center justify-center my-4">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  );
}
