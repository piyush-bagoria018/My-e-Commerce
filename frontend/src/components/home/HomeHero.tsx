"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Container } from "../common/Container";
import { CategoryMenu } from "./CategoryMenu";

import "swiper/css";
import "swiper/css/pagination";

const heroSlides = [
  {
    src: "/home/hero/Copilot_20260328_103126.png",
    alt: "iPhone 17 series banner",
  },
  {
    src: "/home/hero/Copilot_20260328_103809.png",
    alt: "Samsung Galaxy S26 series banner",
  },
  {
    src: "/home/hero/Copilot_20260328_104656.png",
    alt: "Summer fashion sale banner",
  },
  {
    src: "/home/hero/Copilot_20260328_105719.png",
    alt: "Latest gaming laptops banner",
  },
];

export function HomeHero() {
  return (
    <section className="pt-8">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <CategoryMenu />

          <div className="overflow-hidden rounded-3xl">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              loop
              pagination={{
                clickable: true,
                dynamicBullets: false,
              }}
              className="home-hero-swiper"
            >
              {heroSlides.map((slide) => (
                <SwiperSlide key={slide.src}>
                  <div className="relative w-full aspect-4/3 min-h-52 overflow-hidden rounded-3xl bg-[#0f172a] sm:aspect-video sm:min-h-56 lg:aspect-16/7 lg:min-h-60">
                    <Image
                      src={slide.src}
                      alt=""
                      fill
                      aria-hidden="true"
                      className="scale-110 object-cover blur-xl brightness-55"
                      sizes="(max-width: 1024px) 100vw, 72vw"
                    />
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      priority={slide.src === heroSlides[0].src}
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 72vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/10" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/25 to-transparent" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        <style jsx global>{`
          .home-hero-swiper .swiper-pagination {
            bottom: 16px !important;
          }

          .home-hero-swiper .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 0.55);
            opacity: 1;
            margin: 0 5px !important;
            transition: transform 0.2s ease;
          }

          .home-hero-swiper .swiper-pagination-bullet-active {
            background: #e4572e;
            transform: scale(1.05);
          }
        `}</style>
      </Container>
    </section>
  );
}