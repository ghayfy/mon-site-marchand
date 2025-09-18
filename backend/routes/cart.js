import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getCart, addItem, updateItem, removeItem, clearCart } from "../controllers/cartController.js";

const r = Router();
r.get("/", requireAuth(["client","admin"]), getCart);
r.post("/items", requireAuth(["client","admin"]), addItem);
r.put("/items", requireAuth(["client","admin"]), updateItem); // body: {productId, qty}
r.delete("/items/:productId", requireAuth(["client","admin"]), removeItem);
r.delete("/", requireAuth(["client","admin"]), clearCart);
export default r;
