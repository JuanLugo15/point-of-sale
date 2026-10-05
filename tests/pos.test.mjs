import test from "node:test";
import assert from "node:assert/strict";
import { PointOfSale, SaleError, formatReceipt } from "../src/pos.mjs";

function createSale() {
  return new PointOfSale([{ sku: "A-1", name: "Apple", price: 10, stock: 5 }], { taxRate: 0.19 });
}

test("calculates subtotal, discount, tax, and total", () => {
  const sale = createSale();
  sale.addItem("A-1", 2);
  const totals = sale.totals(0.1);
  assert.deepEqual(totals, { subtotal: 20, discountRate: 0.1, discountAmount: 2, taxRate: 0.19, tax: 3.42, total: 21.42 });
});

test("checkout validates payment and decrements stock", () => {
  const sale = createSale();
  sale.addItem("A-1", 2);
  const receipt = sale.checkout({ paymentMethod: "cash", amountPaid: 25 });
  assert.equal(receipt.change, 1.2);
  assert.equal(sale.stock("A-1"), 3);
  assert.equal(sale.cart().length, 0);
});

test("prevents over-selling and unsupported payment methods", () => {
  const sale = createSale();
  assert.throws(() => sale.addItem("A-1", 6), SaleError);
  sale.addItem("A-1", 1);
  assert.throws(() => sale.checkout({ paymentMethod: "crypto", amountPaid: 20 }), /unsupported/);
});

test("formats an understandable receipt", () => {
  const sale = createSale();
  sale.addItem("A-1", 1);
  const receipt = sale.checkout({ paymentMethod: "card", amountPaid: 11.9 });
  assert.match(formatReceipt(receipt), /POINT OF SALE RECEIPT/);
  assert.match(formatReceipt(receipt), /TOTAL: \$11.90/);
});
