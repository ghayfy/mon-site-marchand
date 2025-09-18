import express from "express";
import { Router } from "express";
import { create, capture, webhook } from "../controllers/paypalController.js";
const router = Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.post("/create", create);
function fillOrderId(req, _res, next) {
  const q = req.query || {};
  const b = req.body  || {};
  req.params.orderId = req.params.orderId || q.orderId || q.token || b.orderId || b.token;
  next();
}
router.all("/capture/:orderId", fillOrderId, capture);
router.all("/capture",         fillOrderId, capture);
router.post("/webhook", webhook);
export default router;
