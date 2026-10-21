# Wah!Fur

A React storefront powered by Vite and an Express API.

## Run locally

Install and run MongoDB locally, or create an Atlas cluster and copy its connection string.
Copy `.env.example` to `.env` and set `MONGODB_URI` to that connection string.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The Express API runs on port 4000.

## API

- `GET /api/products` reads the catalog from the MongoDB `products` collection.
- `POST /api/orders` validates and saves an order to the MongoDB `orders` collection.

The server seeds the nine sample products into an empty catalog without overwriting existing products. Set `MONGODB_DB` to use a database other than `wahfur`.

For a production build, run `npm run build` and then `npm start`.