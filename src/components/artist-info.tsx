'use client';

import Image from "next/image"
import { useState } from "react"
import { ArrowRight, User } from "lucide-react"

interface ArtistInfoProps {
  artist: {
    name: string
    bio: string
    image: string
    location: string
    artworksCount: number
  }
}

export function ArtistInfo({ artist }: ArtistInfoProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <section className="py-12 lg:py-16 border-t border-border bg-stone-50/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          {/* Artist Image */}
          <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-secondary border border-border">
            {imageError || !artist.image ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                <User className="h-8 w-8 text-stone-400" />
              </div>
            ) : (
              <Image
                src={artist.image}
                alt={artist.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Artist Info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                The Artist
              </p>
              <h3 className="text-2xl lg:text-3xl font-serif font-semibold text-foreground">
                {artist.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {artist.location} · {artist.artworksCount} 件發表作品
              </p>
            </div>
            <p className="text-base leading-relaxed text-foreground/80 max-w-2xl font-light">
              {artist.bio}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
