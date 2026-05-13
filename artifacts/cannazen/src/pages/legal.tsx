import { useSeo } from "@/hooks/use-seo";
import { Link } from "wouter";
import { useConsent } from "@/hooks/use-consent";
import { Button } from "@/components/ui/button";
import { Cookie, Shield } from "lucide-react";

function LegalShell({ title, lastUpdate, children, slug }: { title: string; lastUpdate: string; slug: string; children: React.ReactNode }) {
  useSeo({ title, canonical: `https://cannazen.fr/${slug}` });
  return (
    <article className="container mx-auto px-6 py-16 max-w-3xl">
      <header className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Information légale</p>
        <h1 className="font-serif text-5xl italic text-foreground mb-4">{title}</h1>
        <p className="text-xs text-muted-foreground">Dernière mise à jour : {lastUpdate}</p>
      </header>
      <div className="prose prose-invert prose-headings:font-serif prose-headings:italic prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-primary max-w-none">
        {children}
      </div>
      <div className="mt-16 p-6 bg-card/40 border border-border/40 rounded-2xl text-xs text-muted-foreground italic text-center">
        Document fourni à titre indicatif. Pour toute publication officielle, faites-le valider par un juriste spécialisé.
      </div>
    </article>
  );
}

export function MentionsLegales() {
  return (
    <LegalShell title="Mentions légales" lastUpdate="29 avril 2026" slug="mentions-legales">
      <h2>Éditeur du site</h2>
      <p><strong>CannaZen SAS</strong> — Société par actions simplifiée au capital de 50 000 €.<br />
      Siège social : 12 rue de la Botanique, 69001 Lyon, France.<br />
      RCS Lyon B 912 345 678 — SIRET 91234567800012 — N° TVA intracommunautaire : FR89 912345678.<br />
      Directeur de la publication : Mary Jane.</p>

      <h2>Hébergement</h2>
      <p>Le site est hébergé par OVHcloud, 2 rue Kellermann, 59100 Roubaix, France.</p>

      <h2>Contact</h2>
      <p>Email : contact@cannazen.fr — Téléphone : 04 78 00 00 00.</p>

      <h2>Conformité produits</h2>
      <p>Tous nos produits respectent la réglementation française et européenne : taux de THC strictement inférieur à 0,3 %, semences certifiées issues de variétés inscrites au catalogue européen, certificats d'analyse (COA) disponibles pour chaque lot.</p>

      <h2>Propriété intellectuelle</h2>
      <p>L'ensemble des contenus (textes, images, logos, code) est protégé par le droit d'auteur. Toute reproduction sans autorisation écrite est interdite.</p>
    </LegalShell>
  );
}

export function CGV() {
  return (
    <LegalShell title="Conditions générales de vente" lastUpdate="29 avril 2026" slug="cgv">
      <h2>Article 1 — Objet</h2>
      <p>Les présentes CGV régissent les ventes de produits à base de chanvre (CBD) conformes à la législation française entre CannaZen SAS et tout consommateur majeur (18 ans révolus).</p>

      <h2>Article 2 — Acceptation</h2>
      <p>La validation d'une commande implique l'acceptation pleine et entière des présentes CGV ainsi que la confirmation expresse de la majorité du client.</p>

      <h2>Article 3 — Produits</h2>
      <p>Nos produits sont commercialisés à des fins de bien-être et ne constituent en aucun cas un médicament. Aucune allégation thérapeutique n'est revendiquée. La consommation de CBD est déconseillée aux femmes enceintes ou allaitantes et incompatible avec la conduite de véhicules.</p>

      <h2>Article 4 — Prix</h2>
      <p>Les prix sont affichés en euros TTC (TVA 20 %). La livraison est offerte à partir de 49 € d'achat. Les codes promotionnels sont cumulables uniquement lorsque cela est explicitement précisé.</p>

      <h2>Article 5 — Commande et paiement</h2>
      <p>Le paiement s'effectue par carte bancaire (Visa, Mastercard, Apple Pay, Google Pay), virement ou paiement en 3 ou 4 fois sans frais via notre partenaire. Toutes les transactions sont sécurisées (3D Secure).</p>

      <h2>Article 6 — Livraison</h2>
      <p>Les commandes sont préparées sous 24 h ouvrées et expédiées via Colissimo, Mondial Relay, Chronopost ou retrait en boutique. Les colis sont neutres et discrets. Les délais indicatifs varient de 24 h (Chronopost) à 5 jours (point relais).</p>

      <h2>Article 7 — Droit de rétractation</h2>
      <p>Conformément à l'article L221-18 du Code de la consommation, vous disposez de 14 jours à compter de la réception pour vous rétracter. Le produit doit être retourné non ouvert et dans son emballage d'origine. Voir notre <Link href="/retours">politique de retour</Link>.</p>

      <h2>Article 8 — Garanties</h2>
      <p>Garantie légale de conformité (2 ans) et garantie contre les vices cachés. Tout défaut doit être signalé sous 7 jours à contact@cannazen.fr.</p>

      <h2>Article 9 — Données personnelles</h2>
      <p>Voir notre <Link href="/confidentialite">politique de confidentialité</Link>.</p>

      <h2>Article 10 — Litiges</h2>
      <p>En cas de litige, médiation gratuite via le médiateur de la consommation de la FEVAD (60 rue La Boétie, 75008 Paris). À défaut, compétence du tribunal de Lyon. Droit applicable : droit français.</p>
    </LegalShell>
  );
}

export function Confidentialite() {
  return (
    <LegalShell title="Politique de confidentialité" lastUpdate="29 avril 2026" slug="confidentialite">
      <h2>Responsable de traitement</h2>
      <p>CannaZen SAS, 12 rue de la Botanique, 69001 Lyon. Délégué à la protection des données : dpo@cannazen.fr.</p>

      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte :</strong> nom, prénom, email, téléphone, date de naissance.</li>
        <li><strong>Commandes :</strong> adresses, historique d'achat.</li>
        <li><strong>Navigation :</strong> cookies (uniquement avec votre consentement).</li>
      </ul>

      <h2>Bases légales</h2>
      <p>Exécution du contrat (commandes), obligations légales (facturation, comptabilité), intérêt légitime (sécurité), consentement (newsletter, cookies non-essentiels).</p>

      <h2>Durée de conservation</h2>
      <p>Données de compte : 3 ans après dernier achat. Factures : 10 ans (obligation légale). Cookies : 13 mois maximum.</p>

      <h2>Vos droits RGPD</h2>
      <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition. Pour exercer vos droits : dpo@cannazen.fr ou via votre <Link href="/mon-compte/profil">espace personnel</Link>. Réclamation possible auprès de la CNIL (cnil.fr).</p>

      <h2>Sécurité</h2>
      <p>Mots de passe chiffrés (bcrypt), connexions HTTPS, sessions signées, hébergement européen.</p>

      <h2>Sous-traitants</h2>
      <p>Hébergement (OVHcloud, France), paiement (Stripe / PayPlug, France), envoi d'emails (Brevo, France), transporteurs (La Poste, Mondial Relay, Chronopost). Aucune donnée n'est transférée hors de l'Union européenne.</p>
    </LegalShell>
  );
}

export function Retours() {
  return (
    <LegalShell title="Livraison & retours" lastUpdate="29 avril 2026" slug="retours">
      <h2>Délais & transporteurs</h2>
      <ul>
        <li><strong>Colissimo Domicile :</strong> 2-3 jours, 4,90 € (offert dès 49 €)</li>
        <li><strong>Colissimo Point Retrait :</strong> 2-3 jours, 3,90 € (offert dès 49 €)</li>
        <li><strong>Mondial Relay :</strong> 3-5 jours, 3,50 € (offert dès 49 €)</li>
        <li><strong>Chronopost Express :</strong> 24 h, 9,90 €</li>
        <li><strong>Click & Collect Lyon :</strong> retrait gratuit en boutique</li>
      </ul>

      <h2>Préparation</h2>
      <p>Toutes les commandes passées avant 14h sont expédiées le jour-même. Emballage neutre, discret et recyclable.</p>

      <h2>Droit de rétractation (14 jours)</h2>
      <p>Vous disposez de 14 jours après réception pour retourner un produit non ouvert et dans son emballage d'origine. Adresse de retour : CannaZen — Service retours, 12 rue de la Botanique, 69001 Lyon. Joignez le bon de retour téléchargeable depuis votre espace.</p>

      <h2>Remboursement</h2>
      <p>Sous 14 jours après réception du retour, sur le moyen de paiement utilisé. Frais de retour à la charge du client (sauf erreur de notre part).</p>

      <h2>Produit défectueux</h2>
      <p>Contactez-nous sous 7 jours à contact@cannazen.fr avec photos. Échange ou remboursement intégral garanti.</p>
    </LegalShell>
  );
}

export function CookiesPage() {
  const { reset } = useConsent();
  return (
    <LegalShell title="Politique de gestion des cookies" lastUpdate="29 avril 2026" slug="cookies">
      <h2>Qu'est-ce qu'un cookie ?</h2>
      <p>Un cookie est un petit fichier déposé sur votre terminal lors de la consultation d'un site. Il permet de mémoriser des informations utiles à votre navigation.</p>

      <h2>Cookies utilisés sur CannaZen</h2>
      <h3>Cookies strictement nécessaires (toujours actifs)</h3>
      <ul>
        <li><code>cz_session</code> : identifiant de session sécurisé (durée 30 jours)</li>
        <li><code>cannazen_session</code> : identifiant panier anonyme (durée 1 an)</li>
        <li><code>cannazen_age_verified</code> : confirmation de majorité</li>
        <li><code>cannazen_cookie_consent</code> : mémorisation de vos choix de cookies</li>
      </ul>

      <h3>Cookies de mesure d'audience (avec consentement)</h3>
      <p>Statistiques anonymisées de fréquentation pour améliorer le site. Données conservées 13 mois maximum.</p>

      <h3>Cookies marketing (avec consentement)</h3>
      <p>Personnalisation des contenus et offres. Aucune donnée n'est cédée à des tiers.</p>

      <h2>Gérer vos préférences</h2>
      <p>Vous pouvez modifier vos choix à tout moment :</p>
      <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Button onClick={reset} variant="outline" className="rounded-full" data-testid="button-reset-cookies">
          <Cookie className="h-4 w-4 mr-2" /> Modifier mes préférences cookies
        </Button>
      </p>
    </LegalShell>
  );
}
