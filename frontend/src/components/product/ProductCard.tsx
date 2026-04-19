import Link from "next/link";
import Image from "next/image";

function WishlistIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 5C5.7912 5 4 6.73964 4 8.88594C4 10.6185 4.7 14.7305 11.5904 18.8873C11.7138 18.961 11.8555 19 12 19C12.1445 19 12.2862 18.961 12.4096 18.8873C19.3 14.7305 20 10.6185 20 8.88594C20 6.73964 18.2088 5 16 5C13.7912 5 12 7.35511 12 7.35511C12 7.35511 10.2088 5 8 5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.257 10.962C21.731 11.582 21.731 12.419 21.257 13.038C19.764 14.987 16.182 19 12 19C7.81801 19 4.23601 14.987 2.74301 13.038C2.51239 12.7411 2.38721 12.3759 2.38721 12C2.38721 11.6241 2.51239 11.2589 2.74301 10.962C4.23601 9.013 7.81801 5 12 5C16.182 5 19.764 9.013 21.257 10.962V10.962Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
                ? "bg-white/90 text-red-500 hover:bg-white/90 hover:text-red-500"
                : "bg-white/90 text-foreground hover:bg-primary hover:text-white"
            }`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <WishlistIcon active={isWishlisted} />
          </button>

          {href ? (
            <Link
              href={href}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm shadow-sm transition hover:bg-accent hover:text-white"
              aria-label="View product"
            >
              <EyeIcon />
            </Link>
          ) : (
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm shadow-sm transition hover:bg-accent hover:text-white"
              aria-label="View product"
            >
              <EyeIcon />
            </button>
          )}
        </div>

        {href ? (
          <Link
            href={href}
            className="block h-full w-full"
            aria-label={`Open ${title}`}
          >
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
          <div className="grid h-full place-items-center text-sm font-medium text-muted">
            {imageLabel}
          </div>
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
        <Link
          href={href}
          className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary"
        >
          {title}
        </Link>
      ) : (
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {title}
        </h3>
      )}

      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-primary">
          Rs {price.toLocaleString()}
        </span>
        {hasDiscount ? (
          <span className="text-muted line-through">
            Rs {originalPrice.toLocaleString()}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted">
        {"★".repeat(Math.round(rating || 0))}
        <span className="ml-1">({reviews})</span>
      </p>
    </article>
  );
}
