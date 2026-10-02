export type DeliveryOptionId = "1" | "2" | "3";

export type Product = {
  id: string;
  image: string;
  name: string;
  rating: { stars: number; count: number };
  priceCents: number;
  keywords: string[];
  type: string | null;
  sizeChartLink: string | null;
};

export type CartItem = {
  productId: string;
  quantity: number;
  deliveryOptionId: DeliveryOptionId;
};

export type OrderStatus = "preparing" | "shipped" | "delivered";

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  priceCents: number;
  quantity: number;
  deliveryOptionId: DeliveryOptionId;
  estimatedDeliveryDate: string;
};

export type Order = {
  id: string;
  createdAt: string;
  totalCents: number;
  status: OrderStatus;
  items: OrderItem[];
};
