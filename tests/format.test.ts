import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatStoredDate,
  publicImagePath,
  ratingImagePath,
} from "@/lib/format";

describe("formatting", () => {
  it("formats cents as dollars", () => {
    expect(formatMoney(2095)).toBe("$20.95");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(2000.5)).toBe("$20.01");
  });

  it("formats stored calendar dates without shifting the day", () => {
    expect(formatStoredDate("2026-10-04", { weekday: "short", month: "long", day: "numeric" })).toBe(
      "Sun, October 4",
    );
  });

  it("points rating stars at the right image, including half stars", () => {
    expect(ratingImagePath(4.5)).toBe("/images/ratings/rating-45.png");
    expect(ratingImagePath(0.5)).toBe("/images/ratings/rating-05.png");
    expect(ratingImagePath(5)).toBe("/images/ratings/rating-50.png");
  });

  it("makes stored image paths absolute", () => {
    expect(publicImagePath("images/products/socks.jpg")).toBe("/images/products/socks.jpg");
    expect(publicImagePath("/images/a.jpg")).toBe("/images/a.jpg");
    expect(publicImagePath("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });
});
