import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { categoriesTable, productsTable, usersTable } from "./schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const categories = [
  { name: "Fleurs CBD", slug: "fleurs-cbd", description: "Essences naturelles cultivées avec passion, récoltées à maturité parfaite", sortOrder: 1, isActive: true, isRestrictable: true },
  { name: "Huiles CBD", slug: "huiles-cbd", description: "Huiles sublinguales premium, full spectrum et broad spectrum", sortOrder: 2, isActive: true, isRestrictable: false },
  { name: "Résines D10", slug: "resines-d10", description: "Hash et pollens à base de Delta-10, concentrés d'exception", sortOrder: 3, isActive: true, isRestrictable: true },
  { name: "Fleurs D10", slug: "fleurs-d10", description: "Fleurs enrichies en Delta-10 pour une expérience unique", sortOrder: 4, isActive: true, isRestrictable: true },
  { name: "Vapes", slug: "vapes", description: "Cartouches et pens CBD pour une vaporisation optimale", sortOrder: 5, isActive: true, isRestrictable: false },
  { name: "Fleurs OH+", slug: "fleurs-oh", description: "Notre gamme exclusive OH+ à l'effet incomparable", sortOrder: 6, isActive: true, isRestrictable: true },
  { name: "Gummies D9", slug: "gummies-d9", description: "Gummies importés d'exception avec Delta-9 légal", sortOrder: 7, isActive: true, isRestrictable: false },
];

type ProductSeed = {
  name: string; slug: string; description: string;
  price: string; compareAtPrice: string | null;
  imageUrl: string; strain: string | null;
  cbdContent: string; thcContent: string;
  origin: string; weight: string; weightGrams: number;
  tags: string[]; rating: string; reviewCount: number;
  isBestseller: boolean; isNew: boolean; isOrganic: boolean;
  batchNumber: string; sku: string;
  metaTitle: string; metaDescription: string;
  categorySlug: string;
};

const products: ProductSeed[] = [
  // FLEURS CBD
  {
    name: "Amnesia Haze Premium", slug: "amnesia-haze-premium",
    description: "Notre Amnesia Haze Indoor est cultivée avec soin dans un environnement contrôlé. Arômes terreux et agrumes, effet relaxant puissant. Taux CBD exceptionnel pour cette variété iconique.",
    price: "7.90", compareAtPrice: null,
    imageUrl: "/products/p1-amnesia-haze.png",
    strain: "Sativa dominante", cbdContent: "18-22%", thcContent: "<0.2%",
    origin: "Suisse", weight: "variable", weightGrams: 50,
    tags: ["indoor", "sativa", "bestseller", "citrus"],
    rating: "4.90", reviewCount: 89, isBestseller: true, isNew: false, isOrganic: true,
    batchNumber: "AH-2025-03-001", sku: "AH-PREMIUM-01",
    metaTitle: "Amnesia Haze Premium CBD Indoor | CannaZen", metaDescription: "Achetez notre Amnesia Haze Premium Indoor, fleur CBD 18-22% cultivée en Suisse. Livraison rapide et discrète.",
    categorySlug: "fleurs-cbd",
  },
  {
    name: "Small Buds Double Cinnamon", slug: "small-buds-double-cinnamon",
    description: "Petits buds de qualité supérieure aux arômes uniques de cannelle et d'épices. Idéale pour les consommateurs réguliers qui recherchent le meilleur rapport qualité-prix. Culture indoor soignée.",
    price: "9.90", compareAtPrice: "12.90",
    imageUrl: "/products/p2-small-buds-cinnamon.png",
    strain: "Hybride", cbdContent: "16-20%", thcContent: "<0.2%",
    origin: "France", weight: "variable", weightGrams: 50,
    tags: ["indoor", "hybride", "bestseller", "epices", "promo"],
    rating: "4.80", reviewCount: 112, isBestseller: true, isNew: false, isOrganic: false,
    batchNumber: "SB-2025-02-007", sku: "SB-CINNAMON-01",
    metaTitle: "Small Buds Double Cinnamon CBD | CannaZen", metaDescription: "Small Buds Double Cinnamon, fleurs CBD 16-20% à petit prix. Qualité supérieure, livraison 24h.",
    categorySlug: "fleurs-cbd",
  },
  {
    name: "Gelato Indoor Premium", slug: "gelato-indoor-premium",
    description: "La reine des variétés indoor. Notre Gelato dévoile des arômes sucrés de dessert avec des notes fruitées et crémeuses. Cultivée en environnement contrôlé pour une qualité irréprochable.",
    price: "11.90", compareAtPrice: null,
    imageUrl: "/products/p3-gelato-indoor.png",
    strain: "Hybride", cbdContent: "22-26%", thcContent: "<0.2%",
    origin: "Italie", weight: "variable", weightGrams: 50,
    tags: ["indoor", "hybride", "premium", "sweet", "dessert"],
    rating: "4.95", reviewCount: 67, isBestseller: false, isNew: false, isOrganic: true,
    batchNumber: "GEL-2025-04-002", sku: "GELATO-IND-01",
    metaTitle: "Gelato Indoor Premium CBD | CannaZen", metaDescription: "Gelato Indoor Premium, 22-26% CBD, arômes fruités et crémeux. La référence du marché.",
    categorySlug: "fleurs-cbd",
  },
  {
    name: "OG Kush Indoor", slug: "og-kush-indoor",
    description: "L'OG Kush est une légende. Notre version CBD indoor respecte tous les codes de cette variété iconique : arômes terreux, pin, et lemon. Une relaxation profonde sans les effets du THC.",
    price: "10.90", compareAtPrice: null,
    imageUrl: "/products/p4-og-kush.png",
    strain: "Indica dominante", cbdContent: "18-22%", thcContent: "<0.2%",
    origin: "Suisse", weight: "variable", weightGrams: 50,
    tags: ["indoor", "indica", "classique", "pin", "citrus"],
    rating: "4.85", reviewCount: 94, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "OGK-2025-03-005", sku: "OGK-IND-01",
    metaTitle: "OG Kush Indoor CBD | CannaZen", metaDescription: "OG Kush Indoor CBD 18-22%, la légende revisitée. Arômes terreux et pin. Expédition 24h.",
    categorySlug: "fleurs-cbd",
  },
  {
    name: "Purple Haze Indoor", slug: "purple-haze-indoor",
    description: "Les teintes violettes sublimes de notre Purple Haze cachent un profil aromatique hors du commun : baies, épices, et une touche florale. Cultivée en indoor pour un résultat visuel et gustatif exceptionnel.",
    price: "12.90", compareAtPrice: null,
    imageUrl: "/products/p12-purple-haze.png",
    strain: "Sativa dominante", cbdContent: "19-23%", thcContent: "<0.2%",
    origin: "Espagne", weight: "variable", weightGrams: 50,
    tags: ["indoor", "sativa", "violet", "baies", "premium"],
    rating: "4.88", reviewCount: 45, isBestseller: false, isNew: true, isOrganic: true,
    batchNumber: "PH-2025-05-001", sku: "PURPLE-IND-01",
    metaTitle: "Purple Haze Indoor CBD | CannaZen", metaDescription: "Purple Haze Indoor, 19-23% CBD, teintes violettes et arômes de baies. Nouvelle collection.",
    categorySlug: "fleurs-cbd",
  },
  {
    name: "White Widow Indoor", slug: "white-widow-indoor",
    description: "La White Widow est l'une des variétés les plus emblématiques au monde. Notre version CBD indoor est couverte de trichomes cristallins et offre un équilibre parfait entre arômes boisés et floraux.",
    price: "9.90", compareAtPrice: null,
    imageUrl: "/products/p17-white-widow.png",
    strain: "Hybride", cbdContent: "15-19%", thcContent: "<0.2%",
    origin: "Pays-Bas", weight: "variable", weightGrams: 50,
    tags: ["indoor", "hybride", "classique", "floral", "boise"],
    rating: "4.75", reviewCount: 78, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "WW-2025-02-011", sku: "WW-IND-01",
    metaTitle: "White Widow Indoor CBD | CannaZen", metaDescription: "White Widow Indoor CBD 15-19%, la classique revisitée. Trichomes cristallins, arômes boisés.",
    categorySlug: "fleurs-cbd",
  },
  // HUILES CBD
  {
    name: "Huile CBD 10% Full Spectrum", slug: "huile-cbd-10-full-spectrum",
    description: "Notre huile CBD 10% Full Spectrum est formulée à partir d'extraits de chanvre français pressés à froid. Elle contient l'intégralité des cannabinoïdes et terpènes pour un effet d'entourage maximal.",
    price: "29.90", compareAtPrice: "39.90",
    imageUrl: "/products/p5-huile-10.png",
    strain: null, cbdContent: "10%", thcContent: "<0.2%",
    origin: "France", weight: "10ml", weightGrams: 15,
    tags: ["huile", "full-spectrum", "10%", "sublingual", "bio"],
    rating: "4.92", reviewCount: 134, isBestseller: true, isNew: false, isOrganic: true,
    batchNumber: "H10-2025-04-003", sku: "HUILE-10-FS-01",
    metaTitle: "Huile CBD 10% Full Spectrum | CannaZen", metaDescription: "Huile CBD 10% Full Spectrum française, pressée à froid. Effet d'entourage maximal. 10ml.",
    categorySlug: "huiles-cbd",
  },
  {
    name: "Huile CBD 5% — Initiation", slug: "huile-cbd-5-initiation",
    description: "Le point d'entrée idéal dans l'univers du CBD. Notre huile 5% est parfaite pour les débutants qui souhaitent découvrir les bienfaits du cannabidiol en douceur. Goût neutre et agréable.",
    price: "19.90", compareAtPrice: null,
    imageUrl: "/products/p6-huile-5.png",
    strain: null, cbdContent: "5%", thcContent: "<0.2%",
    origin: "France", weight: "10ml", weightGrams: 15,
    tags: ["huile", "broad-spectrum", "5%", "debutant", "sublingual"],
    rating: "4.70", reviewCount: 89, isBestseller: false, isNew: false, isOrganic: true,
    batchNumber: "H5-2025-03-008", sku: "HUILE-5-BS-01",
    metaTitle: "Huile CBD 5% Initiation | CannaZen", metaDescription: "Huile CBD 5% idéale pour les débutants. Goût neutre, dosage doux. Livraison France 24h.",
    categorySlug: "huiles-cbd",
  },
  // RÉSINES D10
  {
    name: "Hash Pollen D10", slug: "hash-pollen-d10",
    description: "Notre hash pollen D10 est obtenu par pressage à froid de trichomes de qualité supérieure. Sa texture blonde dorée et ses arômes sucrés et floraux en font une résine d'exception.",
    price: "12.90", compareAtPrice: null,
    imageUrl: "/products/p7-hash-pollen.png",
    strain: "Hash", cbdContent: "30%", thcContent: "<0.2%",
    origin: "Maroc (chanvre légal)", weight: "variable", weightGrams: 50,
    tags: ["resine", "d10", "hash", "pollen", "blond"],
    rating: "4.82", reviewCount: 56, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "HP-D10-2025-03-002", sku: "HASH-POLL-D10-01",
    metaTitle: "Hash Pollen D10 | CannaZen", metaDescription: "Hash Pollen D10 30% CBD, texture blonde, arômes floraux. Qualité premium.",
    categorySlug: "resines-d10",
  },
  {
    name: "Charas CBD Premium", slug: "charas-cbd-premium",
    description: "Inspiré des traditions de la chaîne himalayenne, notre Charas CBD est une résine artisanale d'exception. Sa texture souple et ses arômes boisés et épicés sont incomparables.",
    price: "15.90", compareAtPrice: null,
    imageUrl: "/products/p8-charas.png",
    strain: "Hash artisanal", cbdContent: "25-30%", thcContent: "<0.2%",
    origin: "Népal (chanvre légal)", weight: "variable", weightGrams: 50,
    tags: ["resine", "d10", "charas", "artisanal", "boise", "epice"],
    rating: "4.90", reviewCount: 38, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "CH-2025-02-014", sku: "CHARAS-CBD-01",
    metaTitle: "Charas CBD Premium | CannaZen", metaDescription: "Charas CBD artisanal, 25-30% CBD, arômes boisés et épicés. Tradition himalayenne.",
    categorySlug: "resines-d10",
  },
  // FLEURS D10
  {
    name: "Wapanga — 50% D10", slug: "wapanga-d10",
    description: "La Wapanga est notre fleur phare enrichie en Delta-10. Sa teneur exceptionnelle de 50% D10 offre une expérience sans équivalent. Arômes tropicaux et fruités qui envahissent les sens.",
    price: "8.90", compareAtPrice: null,
    imageUrl: "/products/p9-wapanga.png",
    strain: "Sativa", cbdContent: "50% D10", thcContent: "<0.2%",
    origin: "USA", weight: "variable", weightGrams: 50,
    tags: ["d10", "sativa", "tropical", "fruite", "nouveau"],
    rating: "4.75", reviewCount: 34, isBestseller: false, isNew: true, isOrganic: false,
    batchNumber: "WAP-D10-2025-04-001", sku: "WAPANGA-D10-01",
    metaTitle: "Wapanga 50% D10 | CannaZen", metaDescription: "Wapanga 50% D10, fleur sativa aux arômes tropicaux. Nouvelle gamme D10 exclusive.",
    categorySlug: "fleurs-d10",
  },
  {
    name: "Zoap — 50% D10", slug: "zoap-d10",
    description: "La Zoap est un hybride D10 aux arômes de soap floral unique. Sa teneur de 50% D10 et ses notes de rose, agrumes et savon en font une variété originale et recherchée.",
    price: "10.90", compareAtPrice: null,
    imageUrl: "/products/p10-zoap.png",
    strain: "Hybride", cbdContent: "50% D10", thcContent: "<0.2%",
    origin: "USA", weight: "variable", weightGrams: 50,
    tags: ["d10", "hybride", "floral", "agrumes", "nouveau", "bestseller"],
    rating: "4.80", reviewCount: 28, isBestseller: true, isNew: true, isOrganic: false,
    batchNumber: "ZP-D10-2025-04-003", sku: "ZOAP-D10-01",
    metaTitle: "Zoap 50% D10 | CannaZen", metaDescription: "Zoap 50% D10, arômes floraux et agrumes. Bestseller de la gamme D10.",
    categorySlug: "fleurs-d10",
  },
  {
    name: "Snow White — 60% D10", slug: "snow-white-d10",
    description: "La Snow White est notre cuvée D10 la plus concentrée. À 60% de D10, elle représente le summum de notre gamme. Ses trichomes blancs cristallins et ses arômes vanillés sont inoubliables.",
    price: "9.90", compareAtPrice: null,
    imageUrl: "/products/p11-snow-white.png",
    strain: "Hybride", cbdContent: "60% D10", thcContent: "<0.2%",
    origin: "USA", weight: "variable", weightGrams: 50,
    tags: ["d10", "hybride", "vanille", "cristallin", "concentre"],
    rating: "4.85", reviewCount: 22, isBestseller: false, isNew: true, isOrganic: false,
    batchNumber: "SW-D10-2025-05-001", sku: "SNOWW-D10-01",
    metaTitle: "Snow White 60% D10 | CannaZen", metaDescription: "Snow White 60% D10, notre fleur la plus concentrée. Arômes vanillés et trichomes cristallins.",
    categorySlug: "fleurs-d10",
  },
  // VAPES
  {
    name: "Vape Blueberry CBD", slug: "vape-blueberry-cbd",
    description: "Notre cartouche Blueberry offre un goût de myrtille authentique et intense. Formulée avec du CBD broad spectrum de première qualité, elle garantit une vaporisation propre et savoureuse.",
    price: "19.90", compareAtPrice: null,
    imageUrl: "/products/p13-vape-blueberry.png",
    strain: null, cbdContent: "500mg CBD", thcContent: "0%",
    origin: "UE", weight: "1ml", weightGrams: 5,
    tags: ["vape", "blueberry", "myrtille", "broad-spectrum", "saveur"],
    rating: "4.70", reviewCount: 67, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "VBL-2025-03-009", sku: "VAPE-BLUE-01",
    metaTitle: "Vape Blueberry CBD 500mg | CannaZen", metaDescription: "Cartouche CBD Blueberry 500mg, broad spectrum, vaporisation propre. Goût myrtille authentique.",
    categorySlug: "vapes",
  },
  {
    name: "Vape Mango CBD", slug: "vape-mango-cbd",
    description: "Les arômes exotiques de mangue tropicale dans votre vape. Notre cartouche Mango est une invitation au voyage avec ses notes sucrées et juteuses. CBD broad spectrum 500mg.",
    price: "19.90", compareAtPrice: null,
    imageUrl: "/products/p14-vape-mango.png",
    strain: null, cbdContent: "500mg CBD", thcContent: "0%",
    origin: "UE", weight: "1ml", weightGrams: 5,
    tags: ["vape", "mango", "mangue", "tropical", "saveur"],
    rating: "4.75", reviewCount: 52, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "VMG-2025-03-010", sku: "VAPE-MANGO-01",
    metaTitle: "Vape Mango CBD 500mg | CannaZen", metaDescription: "Cartouche CBD Mango 500mg, arômes mangue tropicale. Vaporisation parfaite.",
    categorySlug: "vapes",
  },
  {
    name: "Vape Mint CBD", slug: "vape-mint-cbd",
    description: "La fraîcheur de la menthe dans une cartouche CBD premium. Notre Vape Mint offre une sensation de fraîcheur intense et prolongée, idéale pour une utilisation en journée.",
    price: "19.90", compareAtPrice: null,
    imageUrl: "/products/p15-vape-mint.png",
    strain: null, cbdContent: "500mg CBD", thcContent: "0%",
    origin: "UE", weight: "1ml", weightGrams: 5,
    tags: ["vape", "mint", "menthe", "frais", "journee"],
    rating: "4.65", reviewCount: 43, isBestseller: false, isNew: false, isOrganic: false,
    batchNumber: "VMT-2025-03-011", sku: "VAPE-MINT-01",
    metaTitle: "Vape Mint CBD 500mg | CannaZen", metaDescription: "Cartouche CBD Mint 500mg, fraîcheur de menthe intense. Idéale pour la journée.",
    categorySlug: "vapes",
  },
  // FLEURS OH+
  {
    name: "Early Girl — 30% OH+", slug: "early-girl-oh",
    description: "Notre Early Girl est la première fleur de notre gamme exclusive OH+. Ses arômes doux et fruités et sa teneur de 30% OH+ en font une expérience sensorielle incomparable. Indica relaxante.",
    price: "8.90", compareAtPrice: null,
    imageUrl: "/products/p16-early-girl.png",
    strain: "Indica", cbdContent: "30% OH+", thcContent: "<0.2%",
    origin: "USA", weight: "variable", weightGrams: 50,
    tags: ["oh+", "indica", "fruite", "relaxant", "nouveau"],
    rating: "4.78", reviewCount: 19, isBestseller: false, isNew: true, isOrganic: false,
    batchNumber: "EG-OH-2025-05-001", sku: "EARLY-OH-01",
    metaTitle: "Early Girl 30% OH+ | CannaZen", metaDescription: "Early Girl 30% OH+, fleur indica exclusive. Arômes fruités, effet relaxant profond.",
    categorySlug: "fleurs-oh",
  },
  // GUMMIES D9
  {
    name: "Cookies® D9 Gummies — Cereal Milk", slug: "cookies-d9-gummies-cereal-milk",
    description: "Les célèbres Cookies® D9 Gummies arrivent en France en exclusivité sur CannaZen ! Le goût Cereal Milk iconique : lait de céréales crémeux, vanille et sucre. Delta-9 légal < 0.3%.",
    price: "24.90", compareAtPrice: null,
    imageUrl: "/products/p18-gummies-cereal.png",
    strain: null, cbdContent: "Delta-9 légal", thcContent: "<0.3%",
    origin: "USA", weight: "pack 20 gummies", weightGrams: 60,
    tags: ["gummies", "d9", "cookies", "cereal-milk", "americain", "nouveau", "bestseller"],
    rating: "4.95", reviewCount: 67, isBestseller: true, isNew: true, isOrganic: false,
    batchNumber: "CK-D9-CM-2025-04-001", sku: "COOK-D9-CM-01",
    metaTitle: "Cookies® D9 Gummies Cereal Milk | CannaZen", metaDescription: "Cookies® D9 Gummies Cereal Milk, importés USA. Delta-9 légal <0.3%. Exclusivité CannaZen.",
    categorySlug: "gummies-d9",
  },
  {
    name: "Cookies® D9 Gummies — Huckleberry Gelato", slug: "cookies-d9-gummies-huckleberry-gelato",
    description: "L'autre saveur iconique Cookies® : Huckleberry Gelato. Des myrtilles sauvages fusionnées avec la douceur d'un gelato crémeux. Une explosion de saveurs pour les connaisseurs.",
    price: "24.90", compareAtPrice: null,
    imageUrl: "/products/p19-gummies-huckleberry.png",
    strain: null, cbdContent: "Delta-9 légal", thcContent: "<0.3%",
    origin: "USA", weight: "pack 20 gummies", weightGrams: 60,
    tags: ["gummies", "d9", "cookies", "huckleberry", "gelato", "americain", "nouveau"],
    rating: "4.88", reviewCount: 52, isBestseller: false, isNew: true, isOrganic: false,
    batchNumber: "CK-D9-HB-2025-04-002", sku: "COOK-D9-HB-01",
    metaTitle: "Cookies® D9 Gummies Huckleberry Gelato | CannaZen", metaDescription: "Cookies® D9 Gummies Huckleberry Gelato. Myrtilles sauvages et gelato crémeux. USA exclusif.",
    categorySlug: "gummies-d9",
  },
];

async function hashPassword(password: string): Promise<string> {
  const hash = createHash("sha256").update(password).digest("hex");
  return `sha256:${hash}`;
}

async function seed() {
  console.log("🌿 Seeding CannaZen database...");

  await db.delete(productsTable);
  await db.delete(categoriesTable);

  const insertedCategories = await db.insert(categoriesTable).values(categories).returning();
  console.log(`✅ ${insertedCategories.length} catégories créées`);

  const catMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  const productsWithCatId = products.map((p) => {
    const { categorySlug, ...rest } = p;
    const categoryId = catMap.get(categorySlug);
    if (!categoryId) throw new Error(`Category not found: ${categorySlug}`);
    return { ...rest, categoryId };
  });

  const insertedProducts = await db.insert(productsTable).values(productsWithCatId).returning();
  console.log(`✅ ${insertedProducts.length} produits créés`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cannazen.fr";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe!Cannazen2026";

  const existingAdmin = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, adminEmail),
  });

  if (!existingAdmin) {
    let passwordHash: string;
    try {
      const bcrypt = await import("bcryptjs");
      passwordHash = await bcrypt.hash(adminPassword, 12);
    } catch {
      passwordHash = await hashPassword(adminPassword);
    }

    await db.insert(usersTable).values({
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "CannaZen",
      role: "admin",
      emailVerified: true,
    });
    console.log(`✅ Admin créé : ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin déjà existant : ${adminEmail}`);
  }

  console.log("🎉 Seed terminé !");
  await pool.end();
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
