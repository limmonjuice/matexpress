"use client";

import dynamic from "next/dynamic";
import { catchError } from "next/error";
import { SceneLabels } from "./labels";
import "./journey.css";

// WebGL only exists in the browser, so the scene is never rendered on the server.
const JourneyScene = dynamic(() => import("./journey-scene"), { ssr: false });

// With no WebGL, or if the scene's code won't load, the story still reads well without a truck on it.
const SceneOrNothing = catchError(() => null);

/** A fixed, see-through layer over the whole page that carries the 3D truck. */
export function TruckStage() {
  return (
    <div className="truck-stage" aria-hidden="true">
      <SceneOrNothing>
        <JourneyScene />
      </SceneOrNothing>
      <SceneLabels />
    </div>
  );
}
