# CannaZen — Configuration & secrets à brancher

Ce projet tourne en autonomie complète avec des **mocks** pour tous les services externes. Cette doc liste les clés / configs à fournir le jour où tu veux passer en production réelle, et où les brancher dans le code.

## 1. Paiement — PayPlug

**État actuel :** mock provider (`MockPaymentProvider`) qui simule un parcours complet (intent → page → webhook → order PAID). Le checkout fonctionne de bout en bout sans clé.

**Variables d'environnement à fournir :**

```env
PAYPLUG_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx    # Clé secrète depuis le dashboard PayPlug
PAYPLUG_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx    # Clé publique
PAYMENT_PROVIDER=payplug                       # Bascule du mock vers PayPlug réel
```

**Fichiers à modifier :**
- `artifacts/api-server/src/services/payment/payplug.ts` — créer cette implémentation à partir de l'interface `PaymentProvider` (cf. `mock.ts`).
- `artifacts/api-server/src/services/payment/index.ts` — ajouter le switch `PAYMENT_PROVIDER === "payplug"` pour instancier la vraie classe.
- Webhook : la route `POST /api/payment/webhook` est déjà câblée, il suffit de valider la signature PayPlug à la place du token mock.

## 2. Email — Brevo (ex Sendinblue)

**État actuel :** `ConsoleEmailProvider` log les emails et les insère dans la table `email_outbox` consultable depuis l'admin (`/console-cz/emails`). Les 8 templates HTML responsives sont déjà définis.

**Variables d'environnement à fournir :**

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=contact@cannazen.fr
BREVO_FROM_NAME=CannaZen
EMAIL_PROVIDER=brevo
```

**Fichiers à modifier :**
- `artifacts/api-server/src/services/email/brevo.ts` — implémenter à partir de `EmailProvider` (cf. `console.ts`).
- `artifacts/api-server/src/services/email/index.ts` — ajouter le switch.

## 3. Connexion Google OAuth

**État actuel :** bouton « Continuer avec Google » présent sur `/connexion`, affiche un toast « Bientôt disponible ». La table `users` a déjà la colonne `googleId` prête.

**Variables d'environnement à fournir :**

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=https://cannazen.fr/api/auth/google/callback
```

**Fichiers à créer :**
- `artifacts/api-server/src/routes/auth-google.ts` — implémenter le flow OAuth (lien `/api/auth/google` + callback).
- `artifacts/cannazen/src/pages/auth/login.tsx` — remplacer le `onClick` du bouton par `window.location.href = "/api/auth/google"`.

## 4. Transporteurs (Colissimo, Mondial Relay, Chronopost)

**État actuel :** calcul réel des frais au poids (Colissimo, Mondial Relay, Chronopost, Click & Collect, International EU) déjà en dur dans `services/shipping`. 10 points relais mockés. Tracking simulé.

**Pour passer en production :**
- **Colissimo** : compte « Boutique Colissimo » + clé API REST → endpoint `services/shipping/colissimo.ts`.
- **Mondial Relay** : code marchand + clé privée → endpoint `services/shipping/mondialrelay.ts`.
- **Chronopost** : compte SOAP → endpoint `services/shipping/chronopost.ts`.

```env
COLISSIMO_ACCOUNT=xxxxxx
COLISSIMO_PASSWORD=xxxxxxxx
MONDIALRELAY_CODE=BDTEST
MONDIALRELAY_KEY=PrivateK
CHRONOPOST_ACCOUNT=xxxxxx
CHRONOPOST_PASSWORD=xxxxxx
```

## 5. Chat client — Crisp

**État actuel :** bulle de chat verte locale en bas à droite avec bot d'accueil (réponses scriptées). Idéal pour les démos.

**Pour activer Crisp à la place :**

```env
VITE_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Le script Crisp est chargé **uniquement après consentement marketing** via `src/components/third-party-loaders.tsx`. Pour cacher la bulle locale quand Crisp est actif, retirer le `<FloatingChat />` du `layout.tsx`.

## 6. Analytics — Google Analytics 4

**État actuel :** rien chargé. Le composant `ThirdPartyLoaders` est prêt à injecter GA4 dès que la clé est présente **et que l'utilisateur a accepté les cookies analytics**.

```env
VITE_GA4_ID=G-XXXXXXXXXX
```

## 7. Stockage images

**État actuel :** images servies depuis `artifacts/cannazen/public/products/*.png` (19 photos IA générées). Upload admin : base64 inline.

**Pour passer à Cloudinary / Replit Object Storage :**

```env
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxx
```

→ Adapter `artifacts/api-server/src/services/storage/`.

## 8. Sentry (monitoring erreurs, optionnel)

```env
SENTRY_DSN=https://xxxxxxxxxxxx@oXXXXXXX.ingest.sentry.io/XXXXXXX
```

## 9. Compte admin par défaut

```
Email     : admin@cannazen.fr
Mot de passe : ChangeMe!Cannazen2026
URL admin : /console-cz
```

**À changer impérativement avant la mise en ligne.**

## 10. Légal — à valider par juriste

Les pages CGV / Mentions légales / Confidentialité / Retours / Cookies contiennent des contenus placeholder professionnels mais portent un marquage **« à valider par juriste »**. Faire relire avant ouverture commerciale.

## 11. Ce qui est déjà 100% prêt sans clé

- Catalogue + recherche + filtres + tri + pagination
- 19 fiches produits avec photos IA + COA placeholder
- Panier persistant (guest + user)
- Checkout 3 étapes + 5 transporteurs + calcul automatique
- Compte client complet (commandes, adresses, fidélité, abonnements, avis)
- Programme fidélité (Bronze/Argent/Or, 1€ = 1 point)
- Codes promo (fixed/percent/free_shipping)
- Blog SEO (front + admin CRUD)
- Admin back-office complet (`/console-cz`)
- Cookie banner CNIL + table `cookie_consents`
- Sitemap.xml + robots.txt + JSON-LD (Organization, Product, Article, BreadcrumbList)
- Age gate +18
- Dark mode + thème clair par défaut
- Responsive mobile
