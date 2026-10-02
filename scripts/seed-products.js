import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
dotenv.config({ path: path.join(projectRoot, ".env") });
// .env.example is optional: settings normally come from .env.
const exampleEnv = dotenv.parse(
  await readFile(path.join(projectRoot, ".env.example"), "utf8").catch(() => ""),
);

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  exampleEnv.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const productsApiUrl = "https://supersimplebackend.dev/products";

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SECRET_KEY in your ignored .env before seeding products.",
  );
}

async function fetchPublicProducts() {
  const response = await fetch(productsApiUrl);
  if (!response.ok) {
    throw new Error(
      `SuperSimple backend returned ${response.status} while loading products.`,
    );
  }

  const productDetails = await response.json();
  if (!Array.isArray(productDetails)) {
    throw new Error("SuperSimple backend returned an invalid product list.");
  }

  return productDetails;
}

const productDetails = await fetchPublicProducts();
if (!productDetails.length)
  throw new Error("The product API returned no products.");

const products = productDetails.map((product) => {
  return {
    id: String(product.id),
    image: product.image,
    name: product.name,
    rating: product.rating,
    price_cents: product.priceCents,
    keywords: product.keywords || [],
    type: product.type || null,
    size_chart_link: product.sizeChartLink || null,
  };
});

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await supabase.from("products").upsert(products);

if (error) throw error;

console.log(
  `Fetched and seeded ${products.length} SuperSimple products into Supabase.`,
);
