'use client';

import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ImageIcon } from "lucide-react"

interface Artwork {
  id: string
  title: string
  artist_name: string
  price: number | null
  is_rentable: boolean
  monthly_rent_price: number | null
  preview_file_url: string
  art_type: "physical" | "digital"
  is_new?: boolean
}

interface ArtworkGridProps {
  artworks: Artwork[]
  title: string
  viewAllLink?: string
}

export function ArtworkGrid({ artworks, title, viewAllLink }: ArtworkGridProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '僅供租賃';
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 lg:mb-12">
          <div>
            <h2 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink}
              className="hidden sm:flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors group"
            >
              瀏覽全部
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          {artworks.map((artwork, index) => {
            // Create asymmetric layout pattern
            const gridClasses = [
              "lg:col-span-5 lg:row-span-2", // Large left
              "lg:col-span-4",                // Medium top right
              "lg:col-span-3",                // Small top far right
              "lg:col-span-4",                // Medium bottom middle
              "lg:col-span-3",                // Small bottom right
            ]
            const aspectClasses = [
              "aspect-[3/4]",    // Tall
              "aspect-[4/3]",    // Wide
              "aspect-square",   // Square
              "aspect-[4/3]",    // Wide
              "aspect-square",   // Square
            ]
            
            return (
              <article 
                key={artwork.id}
                className={`group relative ${gridClasses[index % 5]}`}
              >
                <Link href={`/artwork/${artwork.id}`}>
                  <div className={`relative ${aspectClasses[index % 5]} bg-card rounded-sm overflow-hidden shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 border border-border/20`}>
                    {imageErrors[artwork.id] || !artwork.preview_file_url ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                        <ImageIcon className="h-10 w-10 text-stone-400 mb-2" />
                        <span className="text-[10px] font-medium tracking-wider text-stone-500 uppercase">Artwork Placement</span>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={artwork.preview_file_url}
                          alt={artwork.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                          onError={() => handleImageError(artwork.id)}
                          draggable={false}
                        />
                        {/* 浮水印 — 雙色光暈版 */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 pointer-events-none select-none z-10"
                          style={{
                            backgroundImage: `repeating-linear-gradient(
                              -45deg,
                              transparent 0px, transparent 38px,
                              rgba(255,255,255,0.15) 38px, rgba(255,255,255,0.15) 39px,
                              transparent 39px, transparent 40px,
                              rgba(0,0,0,0.07) 40px, rgba(0,0,0,0.07) 41px
                            )`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="font-serif text-[10px] tracking-[0.3em] uppercase select-none whitespace-nowrap font-medium"
                              style={{
                                transform: 'rotate(-30deg)',
                                color: 'rgba(255,255,255,0.5)',
                                textShadow: '0 0 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7), 1px 1px 0 rgba(0,0,0,0.5)',
                              }}
                            >
                              Atelier Blanc
                            </span>
                          </div>
                        </div>
                        {/* 右鍵防護 */}
                        <div
                          className="absolute inset-0 z-20"
                          onContextMenu={e => e.preventDefault()}
                          onDragStart={e => e.preventDefault()}
                        />
                      </>
                    )}
                    
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {artwork.is_new && (
                        <Badge className="bg-foreground text-background text-[10px] font-medium tracking-wider px-2 py-0.5">
                          NEW
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] font-medium tracking-wider px-2 py-0.5 ${
                          artwork.art_type === "digital" 
                            ? "bg-blue-50/90 text-blue-700 border-blue-200" 
                            : "bg-amber-50/90 text-amber-700 border-amber-200"
                        }`}
                      >
                        {artwork.art_type === "digital" ? "Digital" : "Physical"}
                      </Badge>
                      {artwork.is_rentable && (
                        <Badge className="bg-emerald-600/90 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 border-transparent">
                          可租賃
                        </Badge>
                      )}
                    </div>

                    {/* Info on Hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                      <p className="text-[10px] font-medium tracking-widest text-white/80 uppercase">
                        {artwork.artist_name}
                      </p>
                      <h3 className="text-lg font-serif font-medium text-white mt-1 line-clamp-1">
                        {artwork.title}
                      </h3>
                      <p className="text-sm font-semibold text-white/95 mt-1 font-mono">
                        {artwork.price !== null ? formatPrice(Number(artwork.price)) : `月租金 ${formatPrice(Number(artwork.monthly_rent_price))}`}
                      </p>
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>

        {/* Mobile View All */}
        {viewAllLink && (
          <div className="sm:hidden mt-8 text-center">
            <Link 
              href={viewAllLink}
              className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              瀏覽全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
