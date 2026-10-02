import { formatCurrency } from "../scripts/utils/money.js";
import { requireSupabase } from "../lib/supabase.js";

export function getProduct(productId) {
  let matchingProduct;

  products.forEach((product) => {
    if (productId === product.id) {
      matchingProduct = product;
    }
  });

  return matchingProduct;
}

export class Product {
  id;
  image;
  name;
  rating;
  priceCents;
  keywords;

  constructor(productDetails) {
    this.id = productDetails.id;
    this.image = productDetails.image;
    this.name = productDetails.name;
    this.rating = productDetails.rating;
    this.priceCents = productDetails.priceCents;
    this.keywords = productDetails.keywords;
  }

  getStarsURL() {
    return `images/ratings/rating-${this.rating.stars * 10}.png`;
  }

  getPrice() {
    return `$${formatCurrency(this.priceCents)}`;
  }

  extraInfoHTML() {
    return "";
  }
}

export class Clothing extends Product {
  sizeChartLink;

  constructor(productDetails) {
    super(productDetails);
    this.sizeChartLink = productDetails.sizeChartLink;
  }

  extraInfoHTML() {
    return `
    <a href='${this.sizeChartLink}' target="_blank">
      Size Chart
    </a>
    `;
  }
}

export let products = [];
export let productsSource = "supabase";

/*
export function loadProducts(fun) {
  console.log("load products");
  let XHRresponse;

  const XHR = new XMLHttpRequest();

  XHR.addEventListener("load", () => {
    XHRresponse = XHR.response;
    products = JSON.parse(XHRresponse).map((productDetails) => {
      if (productDetails.type === "clothing") {
        return new Clothing(productDetails);
      }
      return new Product(productDetails);
    });
    fun();
  });

  XHR.addEventListener("error", (e) => {
    console.log('Unexpected error. Please try again later')
  });

  XHR.open("GET", "https://supersimplebackend.dev/products");
  XHR.send();
}
*/

function createProducts(productDetails) {
  return productDetails.map((product) =>
    product.type === "clothing" ? new Clothing(product) : new Product(product),
  );
}

async function loadProductsFromPublicApi() {
  const response = await fetch("https://supersimplebackend.dev/products");
  if (!response.ok) {
    throw new Error(`Product API returned HTTP ${response.status}.`);
  }

  const productDetails = await response.json();
  if (!Array.isArray(productDetails)) {
    throw new Error("Product API returned an invalid product list.");
  }

  products = createProducts(productDetails);
  productsSource = "supersimple";
  return products;
}

export async function loadProductsFromFetch() {
  try {
    const { data, error } = await requireSupabase()
      .from("products")
      .select("*")
      .order("name");

    if (error) throw error;

    if (data?.length) {
      products = createProducts(
        data.map((product) => ({
          id: product.id,
          image: product.image,
          name: product.name,
          rating: product.rating,
          priceCents: product.price_cents,
          keywords: product.keywords,
          type: product.type,
          sizeChartLink: product.size_chart_link,
        })),
      );
      productsSource = "supabase";
      return products;
    }
  } catch (error) {
    console.warn(
      "Supabase catalog unavailable; using the public catalog:",
      error.message,
    );
  }

  return loadProductsFromPublicApi();
}
