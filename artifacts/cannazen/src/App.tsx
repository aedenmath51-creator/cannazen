import { lazy, Suspense, useEffect } from "react";
import { ensureGuestSession } from "@/lib/session";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const Home = lazy(() => import("@/pages/home"));
const Shop = lazy(() => import("@/pages/shop"));
const Product = lazy(() => import("@/pages/product"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Confirmation = lazy(() => import("@/pages/confirmation"));
const Quiz = lazy(() => import("@/pages/quiz"));
const Wishlist = lazy(() => import("@/pages/wishlist"));
const Orders = lazy(() => import("@/pages/orders"));
const PaymentMock = lazy(() => import("@/pages/payment-mock"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const ComingSoon = lazy(() => import("@/pages/coming-soon"));

const Login = lazy(() => import("@/pages/auth/login"));
const Signup = lazy(() => import("@/pages/auth/signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const VerifyEmail = lazy(() => import("@/pages/auth/verify-email"));

const AccountDashboard = lazy(() => import("@/pages/account/dashboard"));
const AccountOrders = lazy(() => import("@/pages/account/orders"));
const AccountAddresses = lazy(() => import("@/pages/account/addresses"));
const AccountProfile = lazy(() => import("@/pages/account/profile"));
const AccountLoyalty = lazy(() => import("@/pages/account/loyalty"));
const AccountSubscriptions = lazy(() => import("@/pages/account/subscriptions"));

import { MentionsLegales, CGV, Confidentialite, Retours, CookiesPage } from "@/pages/legal";

const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/orders"));
const AdminCustomers = lazy(() => import("@/pages/admin/customers"));
const AdminBlog = lazy(() => import("@/pages/admin/blog"));
const AdminPromotions = lazy(() => import("@/pages/admin/promotions"));
const AdminReviews = lazy(() => import("@/pages/admin/reviews"));
const AdminEmails = lazy(() => import("@/pages/admin/emails"));
const AdminAudit = lazy(() => import("@/pages/admin/audit"));
const AdminSubs = lazy(() => import("@/pages/admin/subscriptions"));

function Router() {
  const [location] = useLocation();
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div key={location} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex-1 flex flex-col">
          <Suspense fallback={<div className="h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Switch>
              {/* Catalog */}
              <Route path="/" component={Home} />
              <Route path="/boutique" component={Shop} />
              <Route path="/boutique/:slug" component={Product} />
              <Route path="/panier" component={Cart} />
              <Route path="/commande" component={Checkout} />
              <Route path="/confirmation/:orderId" component={Confirmation} />
              <Route path="/paiement/mock/:intentId" component={PaymentMock} />
              <Route path="/quiz" component={Quiz} />
              <Route path="/wishlist" component={Wishlist} />
              <Route path="/mes-commandes" component={Orders} />

              {/* Blog */}
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPost} />

              {/* Static brand pages */}
              <Route path="/a-propos" component={ComingSoon} />
              <Route path="/nos-terroirs" component={ComingSoon} />
              <Route path="/coffrets" component={ComingSoon} />

              {/* Auth */}
              <Route path="/connexion" component={Login} />
              <Route path="/inscription" component={Signup} />
              <Route path="/mot-de-passe-oublie" component={ForgotPassword} />
              <Route path="/reinitialiser-mdp" component={ResetPassword} />
              <Route path="/verifier-email" component={VerifyEmail} />

              {/* Account */}
              <Route path="/mon-compte" component={AccountDashboard} />
              <Route path="/mon-compte/commandes" component={AccountOrders} />
              <Route path="/mon-compte/adresses" component={AccountAddresses} />
              <Route path="/mon-compte/profil" component={AccountProfile} />
              <Route path="/mon-compte/fidelite" component={AccountLoyalty} />
              <Route path="/mon-compte/abonnements" component={AccountSubscriptions} />

              {/* Legal */}
              <Route path="/mentions-legales" component={MentionsLegales} />
              <Route path="/cgv" component={CGV} />
              <Route path="/confidentialite" component={Confidentialite} />
              <Route path="/retours" component={Retours} />
              <Route path="/cookies" component={CookiesPage} />

              {/* Admin */}
              <Route path="/console-cz/login" component={AdminLogin} />
              <Route path="/console-cz" component={AdminDashboard} />
              <Route path="/console-cz/produits" component={AdminProducts} />
              <Route path="/console-cz/categories" component={AdminCategories} />
              <Route path="/console-cz/commandes" component={AdminOrdersPage} />
              <Route path="/console-cz/clients" component={AdminCustomers} />
              <Route path="/console-cz/blog" component={AdminBlog} />
              <Route path="/console-cz/promotions" component={AdminPromotions} />
              <Route path="/console-cz/avis" component={AdminReviews} />
              <Route path="/console-cz/emails" component={AdminEmails} />
              <Route path="/console-cz/audit" component={AdminAudit} />
              <Route path="/console-cz/abonnements" component={AdminSubs} />

              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    ensureGuestSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
