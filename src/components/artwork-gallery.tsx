'use client';

import Image from "next/image"
import { useState } from "react"
import { ZoomIn, Heart, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ArtworkGalleryProps {
  images: string[]
  title: string
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
      <ImageIcon className="h-16 w-16 text-stone-400 mb-4" />
      <span className="text-sm font-medium tracking-wider text-stone-500 uppercase">{label}</span>
    </div>
  )
}

export function ArtworkGallery({ images, title }: ArtworkGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = images[currentImage] || '';

  return (
    <div className="relative select-none">
      {/* Main Image Frame (Atelier Blanc style) */}
      <div 
        className="relative aspect-[4/5] lg:aspect-[3/4] bg-card rounded-sm overflow-hidden shadow-lg shadow-black/5 border border-border/40"
        onContextMenu={(e) => e.preventDefault()}
      >
        {!imageUrl || imageError ? (
          <ImagePlaceholder label="Artwork Placement" />
        ) : (
          <div className="relative w-full h-full p-4 sm:p-6 md:p-8 bg-stone-50/50 flex items-center justify-center">
            {/* The artwork inside an elegant white passe-partout frame */}
            <div className="relative w-full h-full shadow-2xl shadow-black/10 border border-stone-200 overflow-hidden bg-white">
              <Image
                src={imageUrl}
                alt={`${title}`}
                fill
                className="object-cover transition-all duration-700 hover:scale-105 pointer-events-none"
                sizes="(max-w-7xl) 50vw, 100vw"
                priority
                onError={() => setImageError(true)}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
              {/* 浮水印 Overlay — 對角線斜紋，截圖可見 */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    -45deg,
                    transparent 0px,
                    transparent 60px,
                    rgba(100,80,40,0.055) 60px,
                    rgba(100,80,40,0.055) 61px
                  )`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="font-serif text-xl text-stone-600/20 tracking-[0.5em] uppercase select-none whitespace-nowrap"
                    style={{ transform: 'rotate(-30deg)' }}
                  >
                    Atelier Blanc · Preview Only
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Actions */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLiked(!isLiked)}
            className="h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-md border border-border/40 text-foreground"
          >
            <Heart className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
            <span className="sr-only">Add to wishlist</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-md border border-border/40 text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Zoom</span>
          </Button>
        </div>
      </div>
      
      {/* If there are multiple images, show thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`relative w-16 h-20 flex-shrink-0 rounded-sm overflow-hidden transition-all border ${
                index === currentImage 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent" 
                  : "opacity-60 hover:opacity-100 border-border"
              }`}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover pointer-events-none"
                onDragStart={(e) => e.preventDefault()}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
