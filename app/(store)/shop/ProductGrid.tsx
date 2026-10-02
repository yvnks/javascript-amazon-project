"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ChevronDownIcon } from "@/components/icons";
import { formatMoney, pluralize, ratingImagePath } from "@/lib/format";
import type { Product } from "@/lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const sorters: Record<Exclude<SortKey, "featured">, (a: Product, b: Product) => number> = {
  "price-asc": (a, b) => a.priceCents - b.priceCents,
  "price-desc": (a, b) => b.priceCents - a.priceCents,
  rating: (a, b) => b.rating.stars - a.rating.stars,
};

function matches(product: Product, query: string) {
  if (!query) return true;
  return (
    product.name.toLowerCase().includes(query) ||
    product.keywords.some((keyword) => keyword.toLowerCase().includes(query))
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  function add() {
    addItem(product.id, quantity);
    setAdded(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="product-card">
      <div className="product-image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-image" src={product.image} alt="" loading="lazy" />
        <div className={`added-to-cart${added ? " is-visible" : ""}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icons/checkmark.png" alt="" />
          Added
        </div>
      </div>

      <div className="product-body">
        <div className="product-name limit-text-to-2-lines">{product.name}</div>

        {product.sizeChartLink && (
          <div className="product-extra">
            <a href={product.sizeChartLink} target="_blank" rel="noopener noreferrer">
              Size chart
            </a>
          </div>
        )}

        <div className="product-rating-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="product-rating-stars"
            src={ratingImagePath(product.rating.stars)}
            alt={`${product.rating.stars} out of 5 stars`}
          />
          <div className="product-rating-count">({product.rating.count})</div>
        </div>

        <div className="product-meta">
          <div className="product-price">{formatMoney(product.priceCents)}</div>
          <label>
            <span className="visually-hidden">Quantity for {product.name}</span>
            <select
              className="quantity-select"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {Array.from({ length: 10 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="add-to-cart-button button-primary" type="button" onClick={add}>
          Add to cart
        </button>
        <span className="visually-hidden" role="status">
          {added ? `Added ${product.name} to your cart` : ""}
        </span>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("search") ?? "";
  const query = rawQuery.trim().toLowerCase();
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(() => {
    const filtered = products.filter((product) => matches(product, query));
    return sort === "featured" ? filtered : [...filtered].sort(sorters[sort]);
  }, [products, query, sort]);

  return (
    <>
      <div className="shop-toolbar">
        <label className="chip chip-select">
          <span className="visually-hidden">Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="featured">Sort by</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
          <ChevronDownIcon />
        </label>
        <p className="results-count" aria-live="polite">
          {pluralize(visible.length, "result", "results")}
        </p>
      </div>

      {visible.length ? (
        <div className="products-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="status-message">No products match “{rawQuery.trim()}”.</p>
      )}
    </>
  );
}
