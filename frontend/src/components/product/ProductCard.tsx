import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  imageLabel: string;
  badge?: string;
  imageUrl?: string;
  href?: string;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  actionBusy?: boolean;
  cartActionLabel?: string;
  showCartAction?: boolean;
};

export function ProductCard({
  title,
  price,
  originalPrice,
  rating,
  reviews,
  imageLabel,
  badge,
  imageUrl,
  href,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  actionBusy = false,
  cartActionLabel = "Add to Cart",
  showCartAction = false,
}: ProductCardProps) {
  const hasDiscount = typeof originalPrice !== "undefined";

  return (
    <article className="group rounded-2xl border border-border bg-surface p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative mb-3 h-44 overflow-hidden rounded-xl bg-linear-to-br from-[#f3f6f6] to-[#dfe8e8]">
        {badge ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        ) : null}

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={onToggleWishlist}
            disabled={actionBusy || !onToggleWishlist}
            className={`grid h-8 w-8 place-items-center rounded-full text-sm shadow-sm transition disabled:cursor-not-allowed ${
              isWishlisted
                ? "bg-primary text-white"
                : "bg-white/90 text-foreground hover:bg-primary hover:text-white"
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            ♥
          </button>

          {href ? (
            <Link
              href={href}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm shadow-sm transition hover:bg-accent hover:text-white"
              aria-label="View product"
            >
              👁
            </Link>
          ) : (
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm shadow-sm transition hover:bg-accent hover:text-white"
              aria-label="View product"
            >
              👁
            </button>
          )}
        </div>

        {href ? (
          <Link href={href} className="block h-full w-full" aria-label={`Open ${title}`}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-contain p-1"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm font-medium text-muted">
                {imageLabel}
              </div>
            )}
          </Link>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain p-1"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm font-medium text-muted">{imageLabel}</div>
        )}

        {showCartAction ? (
          <button
            type="button"
            onClick={onAddToCart}
            disabled={actionBusy || !onAddToCart}
            className="absolute inset-x-0 bottom-0 z-10 rounded-b-xl bg-foreground py-3 text-center text-sm font-semibold tracking-wide text-white opacity-100 transition-opacity duration-300 md:py-2.5 md:text-xs md:opacity-0 md:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cartActionLabel}
          </button>
        ) : null}
      </div>

      {href ? (
        <Link href={href} className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary">
          {title}
        </Link>
      ) : (
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{title}</h3>
      )}

      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-primary">Rs {price.toLocaleString()}</span>
        {hasDiscount ? (
          <span className="text-muted line-through">Rs {originalPrice.toLocaleString()}</span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted">
        {"★".repeat(Math.round(rating || 0))}
        <span className="ml-1">({reviews})</span>
      </p>
    </article>
  );
}