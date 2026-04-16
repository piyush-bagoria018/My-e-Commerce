'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Footer } from '@/components/common/Footer';
import { Header } from '@/components/common/Header';
import { TopBar } from '@/components/common/TopBar';
import { Container } from '@/components/common/Container';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProductCard } from '@/components/product/ProductCard';
import { PriceInsightsPanel } from '@/components/product/PriceInsightsPanel';
import { addToCart, getUserCart, removeFromCart } from '@/services/cart.service';
import { getAllProducts, getProductById } from '@/services/product.service';
import {
  getAIAnalysis,
  getPriceRecommendation,
  type PriceTrackingAIAnalysis,
} from '@/services/price-tracking.service';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from '@/services/wishlist.service';
import type { Product } from '@/types/product';

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={active ? 'h-4 w-4 text-amber-500' : 'h-4 w-4 text-gray-300'} fill="currentColor" aria-hidden="true">
      <path d="M10 1.8l2.45 4.96 5.47.79-3.96 3.86.94 5.45L10 14.27l-4.9 2.57.94-5.45L2.08 7.55l5.47-.79L10 1.8z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.8 5.6a5 5 0 00-7 0L12 7.4l-1.8-1.8a5 5 0 10-7 7L12 21l8.8-8.4a5 5 0 000-7z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 5h12v9H3z" />
      <path d="M15 9h3l3 3v2h-6z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7v5h5" />
      <path d="M20 17v-5h-5" />
      <path d="M20 12a8 8 0 00-14-5" />
      <path d="M4 12a8 8 0 0014 5" />
    </svg>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('#e4572e');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [prefetchedAIAnalysis, setPrefetchedAIAnalysis] = useState<PriceTrackingAIAnalysis | null>(null);

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];
  const colorOptions = ['#5b6c7a', '#e4572e'];

  useEffect(() => {
    const loadPageData = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError('');

        const productData = await getProductById(productId);
        setProduct(productData);
        setSelectedImageIndex(0);

        try {
          const productsData = await getAllProducts();
          setAllProducts(productsData);
        } catch {
          setAllProducts([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load product details';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [productId]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !productId || !user?._id) {
      setIsWishlisted(false);
      setIsInCart(false);
      return;
    }

    const loadStates = async () => {
      try {
        const [wishlistData, cartData] = await Promise.all([
          getWishlist().catch(() => null),
          getUserCart(user._id).catch(() => null),
        ]);

        if (wishlistData) {
          setIsWishlisted(wishlistData.products.some((item) => item._id === productId));
        } else {
          setIsWishlisted(false);
        }

        if (cartData) {
          const cartProductIds = cartData.products
            .map((item) =>
              typeof item.productId === 'string' ? item.productId : item.productId?._id
            )
            .filter((id): id is string => Boolean(id));
          setIsInCart(cartProductIds.includes(productId));
        } else {
          setIsInCart(false);
        }
      } catch {
        setIsWishlisted(false);
        setIsInCart(false);
      }
    };

    loadStates();
  }, [authLoading, isAuthenticated, productId, user?._id]);

  useEffect(() => {
    if (!productId) return;

    let isCancelled = false;
    setPrefetchedAIAnalysis(null);

    const preloadCoreAndAI = async () => {
      try {
        // Warm recommendation path so popup core UI can render quickly.
        await getPriceRecommendation(productId);

        const aiResult = await getAIAnalysis(productId);
        if (!isCancelled) {
          setPrefetchedAIAnalysis(aiResult);
        }
      } catch {
        if (!isCancelled) {
          setPrefetchedAIAnalysis(null);
        }
      }
    };

    preloadCoreAndAI();

    return () => {
      isCancelled = true;
    };
  }, [productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return allProducts.filter((item) => item._id !== product._id).slice(0, 4);
  }, [allProducts, product]);

  const changeQuantity = (nextValue: number) => {
    if (!product) return;
    setQuantity(Math.max(1, Math.min(product.stock, nextValue)));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setActionMessage('');

      if (isInCart) {
        await removeFromCart(product._id);
        setIsInCart(false);
        setActionMessage('Removed from cart successfully.');
      } else {
        await addToCart({ productId: product._id, quantity });
        setIsInCart(true);
        setActionMessage('Added to cart successfully.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cart';
      setActionMessage(message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setActionMessage('');

      if (!isInCart) {
        await addToCart({ productId: product._id, quantity });
        setIsInCart(true);
      }
      router.push('/checkout');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add product to cart';
      setActionMessage(message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setActionMessage('');

      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
        setActionMessage('Removed from wishlist successfully.');
      } else {
        await addToWishlist(product._id);
        setIsWishlisted(true);
        setActionMessage('Added to wishlist successfully.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update wishlist';
      setActionMessage(message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />
        <Header />

        <main className="pb-16 pt-10">
          <Container>
            <div className="grid gap-6 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_420px] xl:grid-cols-[110px_minmax(0,1fr)_460px]">
              <div className="h-24 animate-pulse rounded-xl border border-border bg-surface lg:h-96" />
              <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
              <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface md:col-span-2 lg:col-span-1" />
            </div>
          </Container>
        </main>

        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />
        <Header />

        <main className="pb-16 pt-10">
          <Container>
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h1 className="font-display text-2xl font-semibold">{error ? 'Error Loading Product' : 'Product Not Found'}</h1>
              <p className="mt-3 text-sm text-muted">{error || 'The requested product does not exist.'}</p>
              <Link
                href="/products"
                className="mt-6 inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Back to Products
              </Link>
            </div>
          </Container>
        </main>

        <Footer />
      </div>
    );
  }

  const images = product.productImages || [];
  const mainImage = images[selectedImageIndex] || '';
  const inStock = product.stock > 0;
  const reviewsCount = Math.max(8, Math.round((product.ratings || 0) * 32));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header />

      <main className="pb-16 pt-10">
        <Container>
          <div className="mb-10 flex items-center gap-2 text-xs text-muted sm:text-sm">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="transition hover:text-foreground">
              Products
            </Link>
            <span>/</span>
            <span className="line-clamp-1 font-medium text-foreground">{product.name}</span>
          </div>

          <section className="grid gap-6 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[84px_minmax(0,1fr)_420px] xl:grid-cols-[110px_minmax(0,1fr)_460px]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
              {(images.length > 0 ? images : [null]).map((image, index) => (
                <button
                  key={`${image || 'empty'}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-surface transition lg:h-24 lg:w-24 ${
                    selectedImageIndex === index
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="96px"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-xs font-semibold text-muted">No image</span>
                  )}
                </button>
              ))}
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/80 bg-surface">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain p-2 sm:p-3"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    priority
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-semibold text-muted">
                    No product image available
                  </div>
                )}
              </div>
            </div>

            <div className="order-3 md:col-span-2 lg:col-span-1">
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">{product.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center">
                  {[...Array(5)].map((_, index) => (
                    <StarIcon key={`rating-${index}`} active={index < Math.round(product.ratings || 0)} />
                  ))}
                </div>
                <span className="text-muted">({reviewsCount} Reviews)</span>
                <span className="text-border">|</span>
                <span className={inStock ? 'font-medium text-accent' : 'font-medium text-primary'}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-semibold tracking-tight">Rs {product.price.toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => setIsInsightsOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-white"
                >
                  <span className="h-2 w-2 rounded-full bg-current transition group-hover:animate-pulse" />
                  Track Price
                </button>
              </div>

              <p className="mt-4 border-b border-border pb-6 text-sm leading-relaxed text-muted">{product.description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="min-w-16 text-sm font-semibold">Colours:</p>
                <div className="flex items-center gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        selectedColor === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select colour ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="min-w-16 text-sm font-semibold">Size:</p>
                <div className="flex flex-wrap items-center gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-md border px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-md border border-border bg-surface">
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity - 1)}
                    className="px-4 py-2 text-lg leading-none transition hover:bg-background"
                    disabled={addingToCart || !inStock}
                  >
                    -
                  </button>
                  <span className="min-w-12 border-x border-border px-3 py-2 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity + 1)}
                    className="px-4 py-2 text-lg leading-none transition hover:bg-background"
                    disabled={addingToCart || !inStock}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="rounded-md border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                >
                  {isInCart ? 'Remove from Cart' : 'Add to Cart'}
                </button>

               <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="rounded-md bg-primary px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`grid h-11 w-11 place-items-center rounded-md border transition ${
                    isWishlisted
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'
                  }`}
                  aria-label="Save item"
                >
                  <HeartIcon />
                </button>
              </div>

              {actionMessage ? <p className="mt-3 text-xs text-primary">{actionMessage}</p> : null}

              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                <div className="flex items-start gap-3 border-b border-border px-4 py-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <TruckIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Free Delivery</p>
                    <p className="mt-1 text-xs text-muted">Enter your postal code for delivery availability.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
                    <ReturnIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Return Delivery</p>
                    <p className="mt-1 text-xs text-muted">Free 30 days delivery returns. Details apply.</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {relatedProducts.length > 0 ? (
            <section className="mt-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-7 w-2 rounded-full bg-primary" />
                <h2 className="font-display text-xl font-semibold sm:text-2xl">Related Items</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    title={item.name}
                    price={item.price}
                    originalPrice={Math.round(item.price * 1.15)}
                    rating={item.ratings || 0}
                    reviews={Math.max(8, Math.round((item.ratings || 0) * 28))}
                    imageLabel={item.category}
                    imageUrl={item.productImages?.[0]}
                    href={`/products/${item._id}`}
                    badge={item.stock < 10 ? 'Low Stock' : undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </main>

      <Footer />

      {isInsightsOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setIsInsightsOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-2xl sm:inset-y-5 sm:right-5 sm:left-auto sm:h-[calc(100vh-2.5rem)] sm:max-h-none sm:w-full sm:max-w-240 sm:rounded-3xl sm:border sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold sm:text-lg">Price Tracking Insights</h3>
              <button
                type="button"
                onClick={() => setIsInsightsOpen(false)}
                className="rounded-md border border-border px-2 py-0.5 text-[10px] font-semibold transition hover:border-primary hover:text-primary sm:py-1 sm:text-[11px]"
              >
                Close
              </button>
            </div>

            <PriceInsightsPanel
              productId={product._id}
              className="mt-0"
              initialAIAnalysis={prefetchedAIAnalysis}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
