"use client";

import dynamic from "next/dynamic";
import { SceneLabels } from "./labels";
import "./journey.css";

// WebGL only exists in the browser, so the scene is never rendered on the server.
const JourneyScene = dynamic(() => import("./journey-scene"), { ssr: false });

/** A fixed, see-through layer over the whole page that carries the 3D truck. */
export function TruckStage() {
  return (
    <div className="truck-stage" aria-hidden="true">
      <JourneyScene />
      <SceneLabels />
    </div>
  );
}
