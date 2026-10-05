# Point of Sale

Point-of-sale domain project in Node.js for a small shop. It demonstrates state management and business rules behind a checkout flow without hiding the logic behind a framework.

## Features

- Product catalogue with stock control.
- Cart operations: add, update quantity, and remove.
- Percentage discounts and configurable tax rate.
- Cash, card, and transfer payment methods.
- Change calculation and checkout validation.
- Human-readable receipt generation.
- Automated tests for totals, stock, and payment rules.

## Run

```bash
node --test --test-isolation=none tests/pos.test.mjs
node src/cli.mjs demo
```

## Structure

```text
src/pos.mjs       Checkout domain model
src/cli.mjs       Demo command-line flow
data/catalog.json Sample product catalogue
tests/            Checkout and receipt tests
```

The implementation is ready to connect to a database, barcode scanner, or web interface as a next step.
