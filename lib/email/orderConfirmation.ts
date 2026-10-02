import { getDeliveryOption } from "@/lib/delivery";
import { formatMoney, formatStoredDate } from "@/lib/format";
import type { Order } from "@/lib/types";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const deliveryDate = (date: string) =>
  formatStoredDate(date, { weekday: "long", month: "long", day: "numeric" });

export function buildOrderConfirmationEmail({
  order,
  customerName,
  ordersUrl,
}: {
  order: Order;
  customerName: string;
  ordersUrl: string;
}) {
  const itemsCents = order.items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  const shippingCents = order.items.reduce(
    (total, item) => total + getDeliveryOption(item.deliveryOptionId).priceCents,
    0,
  );
  const taxCents = order.totalCents - itemsCents - shippingCents;
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  const totals: [string, string][] = [
    ["Items", formatMoney(itemsCents)],
    ["Shipping", shippingCents ? formatMoney(shippingCents) : "Free"],
    ["Tax", formatMoney(taxCents)],
  ];

  const subject = `Your Soma order #${orderNumber} is confirmed`;

  const text = [
    `Hi ${customerName},`,
    "",
    `Thanks for your order! We've received order #${orderNumber} and we're getting it ready.`,
    "",
    ...order.items.map(
      (item) =>
        `- ${item.name} × ${item.quantity}: ${formatMoney(item.priceCents * item.quantity)} (arrives ${deliveryDate(item.estimatedDeliveryDate)})`,
    ),
    "",
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Total: ${formatMoney(order.totalCents)}`,
    "",
    `Track your order: ${ordersUrl}`,
    "",
    "Soma",
  ].join("\n");

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e7e7e7;">
            <div style="font-size:15px;color:#111111;">${escapeHtml(item.name)}</div>
            <div style="font-size:13px;color:#8b8b8b;margin-top:2px;">
              Qty ${item.quantity} · Arrives ${escapeHtml(deliveryDate(item.estimatedDeliveryDate))}
            </div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e7e7e7;text-align:right;font-size:15px;color:#111111;white-space:nowrap;">
            ${formatMoney(item.priceCents * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const totalRows = totals
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#8b8b8b;">${label}</td>
          <td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${value}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#efefef;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efefef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:22px;padding:32px;">
            <tr>
              <td>
                <div style="font-size:24px;font-weight:700;letter-spacing:-0.03em;color:#111111;">Soma</div>
                <h1 style="margin:24px 0 8px;font-size:26px;font-weight:600;color:#111111;">Thanks for your order, ${escapeHtml(customerName)}!</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#3a3a3a;">
                  We've received order <strong>#${orderNumber}</strong> and we're getting it ready.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                  ${totalRows}
                  <tr>
                    <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#111111;border-top:1px solid #e7e7e7;">Total</td>
                    <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#111111;text-align:right;border-top:1px solid #e7e7e7;">${formatMoney(order.totalCents)}</td>
                  </tr>
                </table>

                <p style="margin:28px 0 0;text-align:center;">
                  <a href="${escapeHtml(ordersUrl)}" style="display:inline-block;padding:14px 28px;background:#111111;color:#ffffff;border-radius:999px;font-size:15px;text-decoration:none;">
                    Track your order
                  </a>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#8b8b8b;">You're receiving this because you placed an order with Soma.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
