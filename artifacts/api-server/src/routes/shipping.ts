import { Router } from "express";
import { SHIPPING_OPTIONS, calculateShipping, findPickupPoints, type CarrierId } from "../lib/shipping";

const router = Router();

router.get("/shipping/options", (req, res) => {
  const subtotal = Number(req.query.subtotal ?? 0);
  const weightGrams = Number(req.query.weightGrams ?? 0);
  const country = (req.query.country as string) ?? "FR";
  const options = SHIPPING_OPTIONS.map((o) => ({
    ...o,
    finalPrice: calculateShipping({ carrierId: o.id, subtotal, weightGrams, country }),
  }));
  res.json(options);
});

router.get("/shipping/pickup-points", (req, res) => {
  const carrierId = req.query.carrier as CarrierId;
  const postalCode = req.query.postalCode as string | undefined;
  if (!carrierId) return res.status(400).json({ error: "carrier requis" });
  res.json(findPickupPoints(carrierId, postalCode));
});

export default router;
