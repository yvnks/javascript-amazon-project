import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/PageHeading";
import { getProducts } from "@/lib/data/products";
import { ProductGrid } from "./ProductGrid";
import "../../styles/shop.css";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main className="main page-shop">
      <PageHeading title="Shop" />
      <Suspense>
        <ProductGrid products={products} />
      </Suspense>
    </main>
  );
}
