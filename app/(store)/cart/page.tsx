import type { Metadata } from "next";
import { getProducts } from "@/lib/data/products";
import { CartView } from "./CartView";
import "../../styles/cart.css";

export const metadata: Metadata = { title: "My cart" };

export default async function CartPage() {
  const products = await getProducts();
  return <CartView products={products} />;
}
