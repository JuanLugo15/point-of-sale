import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PointOfSale, formatReceipt } from "./pos.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const products = JSON.parse(await readFile(join(root, "data", "catalog.json"), "utf8"));

if (process.argv[2] === "demo") {
  const sale = new PointOfSale(products);
  sale.addItem("CAF-001", 2);
  sale.addItem("MUG-002", 1);
  const receipt = sale.checkout({ paymentMethod: "cash", amountPaid: 60, discountRate: 0.1 });
  console.log(formatReceipt(receipt));
} else {
  console.log("Usage: node src/cli.mjs demo");
}
