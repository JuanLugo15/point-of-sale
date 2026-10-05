export class SaleError extends Error {}

const METHODS = new Set(["cash", "card", "transfer"]);

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class PointOfSale {
  #catalog = new Map();
  #cart = new Map();
  #taxRate;

  constructor(products = [], { taxRate = 0.19 } = {}) {
    this.#taxRate = Number(taxRate);
    if (!Number.isFinite(this.#taxRate) || this.#taxRate < 0) throw new SaleError("tax rate must be non-negative");
    for (const product of products) {
      const sku = String(product.sku ?? "").trim().toUpperCase();
      if (!sku || !product.name || !Number.isFinite(Number(product.price)) || Number(product.price) < 0 || !Number.isInteger(product.stock) || product.stock < 0) throw new SaleError("invalid product catalogue");
      this.#catalog.set(sku, { sku, name: product.name, price: money(Number(product.price)), stock: product.stock });
    }
  }

  addItem(sku, quantity = 1) {
    const key = String(sku).trim().toUpperCase();
    const product = this.#catalog.get(key);
    const amount = Number(quantity);
    if (!product) throw new SaleError("product not found: " + key);
    if (!Number.isInteger(amount) || amount <= 0) throw new SaleError("quantity must be a positive integer");
    const current = this.#cart.get(key) ?? 0;
    if (current + amount > product.stock) throw new SaleError("insufficient stock for " + key);
    this.#cart.set(key, current + amount);
    return this.cart();
  }

  removeItem(sku) {
    this.#cart.delete(String(sku).trim().toUpperCase());
    return this.cart();
  }

  cart() {
    return [...this.#cart.entries()].map(([sku, quantity]) => {
      const product = this.#catalog.get(sku);
      return { sku, name: product.name, quantity, unitPrice: product.price, lineTotal: money(product.price * quantity) };
    });
  }

  totals(discountRate = 0) {
    const discount = Number(discountRate);
    if (!Number.isFinite(discount) || discount < 0 || discount > 1) throw new SaleError("discount must be between 0 and 1");
    const subtotal = money(this.cart().reduce((sum, line) => sum + line.lineTotal, 0));
    const discountAmount = money(subtotal * discount);
    const taxable = money(subtotal - discountAmount);
    const tax = money(taxable * this.#taxRate);
    return { subtotal, discountRate: discount, discountAmount, taxRate: this.#taxRate, tax, total: money(taxable + tax) };
  }

  checkout({ paymentMethod, amountPaid, discountRate = 0 }) {
    if (!METHODS.has(paymentMethod)) throw new SaleError("unsupported payment method");
    const totals = this.totals(discountRate);
    const paid = Number(amountPaid);
    if (!Number.isFinite(paid) || paid < totals.total) throw new SaleError("payment is lower than the total");
    for (const [sku, quantity] of this.#cart.entries()) this.#catalog.get(sku).stock -= quantity;
    const receipt = { ...totals, paymentMethod, amountPaid: money(paid), change: money(paid - totals.total), items: this.cart() };
    this.#cart.clear();
    return receipt;
  }

  stock(sku) {
    return this.#catalog.get(String(sku).trim().toUpperCase())?.stock ?? null;
  }
}

export function formatReceipt(receipt) {
  const lines = ["POINT OF SALE RECEIPT", "---------------------"];
  receipt.items.forEach((item) => lines.push(item.quantity + " x " + item.name + "  $" + item.lineTotal.toFixed(2)));
  lines.push("---------------------", "Subtotal: $" + receipt.subtotal.toFixed(2), "Discount: -$" + receipt.discountAmount.toFixed(2), "Tax: $" + receipt.tax.toFixed(2), "TOTAL: $" + receipt.total.toFixed(2), "Paid by: " + receipt.paymentMethod, "Change: $" + receipt.change.toFixed(2));
  return lines.join("\n");
}
