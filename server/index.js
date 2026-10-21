import express from "express";
import "dotenv/config";
import { MongoClient } from "mongodb";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 4000;
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const allowedAssets = new Set(["wahfurname.png"]);
let mongoClient;
let productsCollection;
let ordersCollection;

const products = [
  { id: "wf-01", name: "The Sunday Shirt", category: "Everyday", price: 1890, image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85", color: "Cloud white" },
  { id: "wf-02", name: "After Hours Tee", category: "Streetwear", price: 1290, image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85", color: "Washed black" },
  { id: "wf-03", name: "Soft Focus Set", category: "Everyday", price: 2490, image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85", color: "Olive" },
  { id: "wf-04", name: "The Big Mood Hoodie", category: "Streetwear", price: 2890, image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85", color: "Rust" },
  { id: "wf-05", name: "Little Black Moment", category: "Occasion", price: 3290, image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=85", color: "Black" },
  { id: "wf-06", name: "Off-Duty Denim", category: "Everyday", price: 2190, image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85", color: "Indigo" },
  { id: "wf-07", name: "Main Character Coat", category: "Occasion", price: 3890, image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85", color: "Chocolate" },
  { id: "wf-08", name: "Weekend Uniform", category: "Streetwear", price: 1990, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85", color: "Stone" },
  { id: "wf-09", name: "Good Things Top", category: "Occasion", price: 1690, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85", color: "Cherry" },
];

app.use(express.json({ limit: "20kb" }));

app.get("/api/products", async (_request, response) => {
  const catalog = await productsCollection.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
  response.json(catalog);
});

app.post("/api/orders", async (request, response) => {
  const { name, email, items } = request.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 20
  ) {
    return response.status(400).json({ error: "Add your name, a valid email, and between 1 and 20 items." });
  }

  if (items.some((item) => !item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
    return response.status(400).json({ error: "One or more items in your bag are invalid." });
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const catalogItems = await productsCollection.find({ id: { $in: productIds } }, { projection: { _id: 0 } }).toArray();
  const catalogById = new Map(catalogItems.map((product) => [product.id, product]));
  if (items.some((item) => !catalogById.has(item.productId))) {
    return response.status(400).json({ error: "One or more items in your bag are invalid." });
  }

  const orderItems = items.map((item) => {
    const product = catalogById.get(item.productId);
    return { productId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.price };
  });
  const order = {
    id: `WF-${Date.now().toString(36).toUpperCase()}`,
    name: name.trim(),
    email: email.trim(),
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    createdAt: new Date(),
  };

  await ordersCollection.insertOne(order);
  return response.status(201).json({ orderId: order.id });
});

app.get("/assets/:filename", (request, response) => {
  if (!allowedAssets.has(request.params.filename)) {
    return response.sendStatus(404);
  }
  return response.sendFile(path.join(projectRoot, request.params.filename));
});

const builtApp = path.join(projectRoot, "dist");
app.use(express.static(builtApp));
app.use((_request, response) => response.sendFile(path.join(builtApp, "index.html")));

app.use((error, _request, response, _next) => {
  console.error("Request failed:", error);
  response.status(500).json({ error: "Something went wrong. Please try again." });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in your environment or .env file before starting the server.");
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  const database = mongoClient.db(process.env.MONGODB_DB || "wahfur");
  productsCollection = database.collection("products");
  ordersCollection = database.collection("orders");

  await productsCollection.createIndex({ id: 1 }, { unique: true });
  await productsCollection.bulkWrite(products.map((product) => ({
    updateOne: {
      filter: { id: product.id },
      update: { $setOnInsert: product },
      upsert: true,
    },
  })));

  app.listen(port, () => {
    console.log(`Wah!Fur API connected to MongoDB and listening on http://localhost:${port}`);
  });
}

process.once("SIGINT", () => mongoClient?.close().finally(() => process.exit(0)));
process.once("SIGTERM", () => mongoClient?.close().finally(() => process.exit(0)));

startServer().catch(async (error) => {
  console.error(`Unable to start Wah!Fur API: ${error.message}`);
  await mongoClient?.close();
  process.exitCode = 1;
});