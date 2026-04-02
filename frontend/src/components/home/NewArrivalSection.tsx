import Link from "next/link";
import Image from "next/image";
import { Container } from "../common/Container";
import { SectionHeader } from "../common/SectionHeader";

const NEW_ARRIVAL_IMAGES = {
  ps5: "/home/new_arrival/pic1.png",
  womenCollection: "/home/new_arrival/pic2.jpg?v=20260329",
  speakers: "/home/new_arrival/pic4.png",
  perfume: "/home/new_arrival/pic3.png",
};

export function NewArrivalSection() {
  return (
    <section className="pt-10 sm:pt-14">
      <Container>
        <SectionHeader eyebrow="Featured" title="New Arrival" />
        <div className="grid gap-4 lg:grid-cols-2">
          {/* LEFT — big tall card */}
          <div className="relative min-h-64 overflow-hidden rounded-3xl bg-black p-5 sm:min-h-80 sm:p-7 lg:min-h-95 lg:p-8 xl:min-h-105">
            {NEW_ARRIVAL_IMAGES.ps5 ? (
              <Image
                src={NEW_ARRIVAL_IMAGES.ps5}
                alt="PlayStation 5"
                fill
                className="object-contain object-bottom-right p-3"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            ) : null}
            <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <h3 className="font-display text-2xl font-bold text-white">
                PlayStation 5
              </h3>
              <p className="mt-2 max-w-xs text-sm text-white/70">
                Black &amp; White editions back in stock. Limited units only.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-block w-fit border-b border-white/60 pb-0.5 text-sm font-semibold text-white transition hover:border-white"
              >
                Shop Now →
              </Link>
            </div>
          </div>

          {/* RIGHT — stacked */}
          <div className="grid gap-4">
            {/* Top: Women's Collection — wide */}
            <div className="relative min-h-52 overflow-hidden rounded-3xl bg-black p-5 sm:min-h-60 sm:p-7 lg:min-h-47.5 lg:p-8">
              {NEW_ARRIVAL_IMAGES.womenCollection ? (
                <Image
                  src={NEW_ARRIVAL_IMAGES.womenCollection}
                  alt="Women's collections"
                  fill
                  unoptimized
                  className="origin-bottom-right object-contain object-bottom-right p-2 -rotate-6 scale-105"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end">
                <h3 className="font-display text-xl font-bold text-white">
                  Women&apos;s Collections
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Featured collections that give you another vibe.
                </p>
                <Link
                  href="/products"
                  className="mt-4 inline-block w-fit border-b border-white/60 pb-0.5 text-sm font-semibold text-white transition hover:border-white"
                >
                  Shop Now →
                </Link>
              </div>
            </div>

            {/* Bottom row: 2 equal cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative min-h-44 overflow-hidden rounded-3xl bg-black p-5 sm:min-h-47.5 sm:p-6">
                {NEW_ARRIVAL_IMAGES.speakers ? (
                  <Image
                    src={NEW_ARRIVAL_IMAGES.speakers}
                    alt="Speakers"
                    fill
                    className="object-contain object-bottom-right p-2"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-end">
                  <h3 className="font-display text-base font-bold text-white">
                    Speakers
                  </h3>
                  <p className="mt-1 text-xs text-white/70">
                    Wireless speakers on sale.
                  </p>
                  <Link
                    href="/products"
                    className="mt-3 inline-block w-fit border-b border-white/60 pb-0.5 text-xs font-semibold text-white transition hover:border-white"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>

              <div className="relative min-h-44 overflow-hidden rounded-3xl bg-black p-5 sm:min-h-47.5 sm:p-6">
                {NEW_ARRIVAL_IMAGES.perfume ? (
                  <Image
                    src={NEW_ARRIVAL_IMAGES.perfume}
                    alt="Perfume"
                    fill
                    className="object-contain object-bottom-right p-2"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-end">
                  <h3 className="font-display text-base font-bold text-white">
                    Perfume
                  </h3>
                  <p className="mt-1 text-xs text-white/70">
                    Luxury fragrance collection.
                  </p>
                  <Link
                    href="/products"
                    className="mt-3 inline-block w-fit border-b border-white/60 pb-0.5 text-xs font-semibold text-white transition hover:border-white"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
