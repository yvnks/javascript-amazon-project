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
const exampleEnv = dotenv.parse(
  await readFile(path.join(projectRoot, ".env.example"), "utf8"),
);

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  exampleEnv.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SECRET_KEY in your ignored .env before seeding products.",
  );
}

const productsPath = path.join(projectRoot, "backend", "products.json");
const productDetails = JSON.parse(await readFile(productsPath, "utf8"));
const products = productDetails.map((product) => ({
  id: product.id,
  image: product.image,
  name: product.name,
  rating: product.rating,
  price_cents: product.priceCents,
  keywords: product.keywords || [],
  type: product.type || null,
  size_chart_link: product.sizeChartLink || null,
}));

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await supabase.from("products").upsert(products);

if (error) throw error;

console.log(`Seeded ${products.length} products into Supabase.`);
