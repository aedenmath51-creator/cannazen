import { nanoid } from "nanoid";

export type CarrierId = "colissimo_home" | "colissimo_relay" | "mondial_relay" | "chronopost" | "click_collect";

export interface ShippingOption {
  id: CarrierId;
  carrier: string;
  service: string;
  estimatedDays: string;
  price: number;
  freeAbove?: number;
  requiresPickupPoint: boolean;
  description: string;
}

const FREE_SHIPPING_THRESHOLD = 49;

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "colissimo_home", carrier: "Colissimo", service: "Livraison à domicile", estimatedDays: "2-3 jours", price: 4.9, freeAbove: FREE_SHIPPING_THRESHOLD, requiresPickupPoint: false, description: "La Poste, livraison à votre adresse." },
  { id: "colissimo_relay", carrier: "Colissimo", service: "Point retrait", estimatedDays: "2-3 jours", price: 3.9, freeAbove: FREE_SHIPPING_THRESHOLD, requiresPickupPoint: true, description: "Retrait dans un bureau de poste partenaire." },
  { id: "mondial_relay", carrier: "Mondial Relay", service: "Point relais", estimatedDays: "3-5 jours", price: 3.5, freeAbove: FREE_SHIPPING_THRESHOLD, requiresPickupPoint: true, description: "Discret et économique, idéal pour le CBD." },
  { id: "chronopost", carrier: "Chronopost", service: "Express 24h", estimatedDays: "1 jour ouvré", price: 9.9, requiresPickupPoint: false, description: "Livraison express le lendemain." },
  { id: "click_collect", carrier: "Click & Collect", service: "Retrait en boutique", estimatedDays: "Sous 24h", price: 0, requiresPickupPoint: false, description: "Retrait gratuit à notre boutique de Lyon." },
];

export function calculateShipping(opts: { carrierId: CarrierId; subtotal: number; weightGrams?: number; country?: string }): number {
  const option = SHIPPING_OPTIONS.find((o) => o.id === opts.carrierId);
  if (!option) return 4.9;
  if (option.freeAbove && opts.subtotal >= option.freeAbove) return 0;
  let price = option.price;
  if (opts.country && opts.country !== "FR") {
    price = price * 2.5;
  }
  if (opts.weightGrams && opts.weightGrams > 1000) {
    price = price + Math.ceil((opts.weightGrams - 1000) / 500) * 1.5;
  }
  return Math.round(price * 100) / 100;
}

export interface PickupPoint {
  id: string;
  carrierId: CarrierId;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  hours: string;
  distance?: string;
}

const MOCK_PICKUP_POINTS: PickupPoint[] = [
  { id: "MR-69001-001", carrierId: "mondial_relay", name: "Tabac Le Central", address: "12 rue de la République", city: "Lyon", postalCode: "69001", hours: "Lun-Sam 7h-20h", distance: "0.4 km" },
  { id: "MR-69002-002", carrierId: "mondial_relay", name: "Presse Bellecour", address: "5 place Bellecour", city: "Lyon", postalCode: "69002", hours: "Lun-Dim 8h-22h", distance: "0.8 km" },
  { id: "MR-75011-003", carrierId: "mondial_relay", name: "Épicerie de la Bastille", address: "23 rue de la Roquette", city: "Paris", postalCode: "75011", hours: "Lun-Sam 8h-21h" },
  { id: "MR-75001-004", carrierId: "mondial_relay", name: "Tabac du Châtelet", address: "8 avenue Victoria", city: "Paris", postalCode: "75001", hours: "Lun-Sam 7h-19h" },
  { id: "CO-69001-001", carrierId: "colissimo_relay", name: "Bureau de Poste Lyon Hôtel-de-Ville", address: "1 place des Terreaux", city: "Lyon", postalCode: "69001", hours: "Lun-Ven 9h-18h, Sam 9h-12h" },
  { id: "CO-75004-002", carrierId: "colissimo_relay", name: "Bureau de Poste Paris Hôtel-de-Ville", address: "2 rue Lobau", city: "Paris", postalCode: "75004", hours: "Lun-Ven 9h-18h" },
  { id: "MR-13001-005", carrierId: "mondial_relay", name: "Maison de la Presse Marseille", address: "55 rue de la Canebière", city: "Marseille", postalCode: "13001", hours: "Lun-Sam 8h-19h" },
  { id: "MR-31000-006", carrierId: "mondial_relay", name: "Tabac Capitole Toulouse", address: "10 place du Capitole", city: "Toulouse", postalCode: "31000", hours: "Lun-Sam 7h30-19h30" },
  { id: "MR-33000-007", carrierId: "mondial_relay", name: "Presse Bordeaux Quinconces", address: "3 cours du XXX Juillet", city: "Bordeaux", postalCode: "33000", hours: "Lun-Sam 8h-20h" },
  { id: "MR-44000-008", carrierId: "mondial_relay", name: "Tabac Place Royale Nantes", address: "1 place Royale", city: "Nantes", postalCode: "44000", hours: "Lun-Sam 8h-19h" },
];

export function findPickupPoints(carrierId: CarrierId, postalCode?: string): PickupPoint[] {
  let points = MOCK_PICKUP_POINTS.filter((p) => p.carrierId === carrierId);
  if (postalCode) {
    const prefix = postalCode.slice(0, 2);
    const matching = points.filter((p) => p.postalCode.startsWith(prefix));
    if (matching.length > 0) points = matching;
  }
  return points.slice(0, 8);
}

export function generateTracking(carrierId: CarrierId): { trackingNumber: string; trackingUrl: string } {
  const trackingNumber = `${carrierId.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-9)}FR`;
  const urls: Record<string, string> = {
    colissimo_home: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    colissimo_relay: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    mondial_relay: `https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=${trackingNumber}`,
    chronopost: `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${trackingNumber}`,
    click_collect: "#",
  };
  return { trackingNumber, trackingUrl: urls[carrierId] ?? "#" };
}

export function shippingLabel(carrierId: CarrierId): string {
  const opt = SHIPPING_OPTIONS.find((o) => o.id === carrierId);
  return opt ? `${opt.carrier} — ${opt.service}` : carrierId;
}
