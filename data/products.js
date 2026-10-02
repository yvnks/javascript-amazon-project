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

export function loadProductsFromFetch() {
  return requireSupabase()
    .from("products")
    .select("*")
    .order("name")
    .then(({ data, error }) => {
      if (error) throw error;

      products = data.map((product) => {
        const productDetails = {
          id: product.id,
          image: product.image,
          name: product.name,
          rating: product.rating,
          priceCents: product.price_cents,
          keywords: product.keywords,
          sizeChartLink: product.size_chart_link,
        };

        return product.type === "clothing"
          ? new Clothing(productDetails)
          : new Product(productDetails);
      });

      return products;
    });
}
