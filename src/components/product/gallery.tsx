"use client";

import { useState } from "react";
import Image from "next/image";
import type { Drawing, ProductImage } from "@/lib/catalog/types";
import { ShopDrawing } from "./shop-drawing";

type Props = {
  images: ProductImage[];
  drawing?: Drawing;
  name: string;
  size: string;
};

export function Gallery({ images, drawing, name, size }: Props) {
  const [view, setView] = useState(0);
  const views = images.length + (drawing ? 1 : 0);
  const onDrawing = drawing && view === images.length;
  const current = images[view];

  return (
    <div className="hm-gallery">
      <div className="hm-gallery-main" data-drawing={Boolean(onDrawing)}>
        {onDrawing && drawing ? (
          <ShopDrawing drawing={drawing} label={`${name}, ${size}`} />
        ) : (
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(max-width: 959px) 100vw, 620px"
            preload={view === 0}
            className={current.kind === "in-use" ? "hm-gallery-photo" : "hm-gallery-cut"}
          />
        )}
      </div>
      {views > 1 && (
        <div className="hm-gallery-thumbs" role="group" aria-label="Pictures of this product">
          {images.map((image, i) => (
            <button type="button" key={image.src} aria-pressed={view === i} aria-label={image.kind === "in-use" ? "Show it in use" : "Show the product"} onClick={() => setView(i)}>
              <Image src={image.src} alt="" width={84} height={84} />
              <span>{image.kind === "in-use" ? "In use" : "Product"}</span>
            </button>
          ))}
          {drawing && (
            <button type="button" className="hm-gallery-thumb-sd" aria-pressed={onDrawing} aria-label="Show the scale drawing" onClick={() => setView(images.length)}>
              <ShopDrawing drawing={drawing} label="" />
              <span>To scale</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
