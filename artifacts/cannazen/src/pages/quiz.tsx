import { useState } from "react";
import { useLocation } from "wouter";

const QUESTIONS = [
  {
    id: "objective",
    question: "Quel est votre objectif principal ?",
    options: [
      { value: "relax",    label: "Me détendre",          desc: "Réduire le stress et l'anxiété au quotidien" },
      { value: "sleep",    label: "Mieux dormir",          desc: "Favoriser un sommeil profond et réparateur" },
      { value: "focus",    label: "Me concentrer",         desc: "Rester alerte et productif sans nervosité" },
      { value: "energy",   label: "Retrouver de l'énergie",desc: "Lutter contre la fatigue et la léthargie" },
      { value: "pleasure", label: "Plaisir et euphorie",   desc: "Rechercher un effet récréatif légal" },
    ],
  },
  {
    id: "format",
    question: "Comment préférez-vous consommer ?",
    options: [
      { value: "oil",      label: "Huile sublinguale",     desc: "Précise, rapide, discrète — quelques gouttes" },
      { value: "flower",   label: "Fleurs CBD",            desc: "Expérience naturelle et aromatique" },
      { value: "infusion", label: "Infusion",              desc: "Rituel apaisant, effet doux et progressif" },
      { value: "capsule",  label: "Gélules ou capsules",   desc: "Pratique, dosage fixe, sans goût" },
      { value: "vape",     label: "Vaporisation",          desc: "Rapide, discret, portable" },
      { value: "gummies",  label: "Gummies",               desc: "Savoureux, facile à doser, effet progressif" },
    ],
  },
  {
    id: "experience",
    question: "Quelle est votre expérience avec le CBD ?",
    options: [
      { value: "novice",   label: "Débutant",              desc: "Je n'ai jamais essayé le CBD" },
      { value: "casual",   label: "Occasionnel",           desc: "J'ai déjà testé quelques fois" },
      { value: "regular",  label: "Régulier",              desc: "Je consomme souvent, je connais mes effets" },
      { value: "expert",   label: "Connaisseur",           desc: "J'ai des préférences très précises" },
    ],
  },
  {
    id: "intensity",
    question: "Quelle intensité recherchez-vous ?",
    options: [
      { value: "douce",    label: "Douce",                 desc: "Effet subtil, idéal pour commencer ou le quotidien" },
      { value: "moderee",  label: "Modérée",               desc: "Un effet bien présent mais maîtrisé" },
      { value: "intense",  label: "Intense",               desc: "Je veux vraiment sentir quelque chose" },
    ],
  },
  {
    id: "budget",
    question: "Quel est votre budget ?",
    options: [
      { value: "moins20",  label: "Moins de 20 €",         desc: "Découvrir sans trop investir" },
      { value: "20-40",    label: "20 € – 40 €",           desc: "Un bon rapport qualité/prix" },
      { value: "plus40",   label: "Plus de 40 €",          desc: "Prioriser la qualité premium" },
    ],
  },
];

type Rec = {
  slug: string; name: string; price: string;
  category: string; cbdContent: string | null;
  isBestseller: boolean; isNew: boolean; reason: string;
};

type QuizResult = { intro: string; recommendations: Rec[] };

type State =
  | { phase: "quiz" }
  | { phase: "loading" }
  | { phase: "result"; data: QuizResult }
  | { phase: "error"; msg: string };

export default function QuizPage() {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState]     = useState<State>({ phase: "quiz" });
  const [, nav]               = useLocation();

  async function choose(value: string) {
    const q = QUESTIONS[step];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);

    if (step + 1 < QUESTIONS.length) {
      setStep(s => s + 1);
    } else {
      setState({ phase: "loading" });
      try {
        const base = import.meta.env.BASE_URL ?? "/";
        const apiBase = base.replace(/\/$/, "");
        const r = await fetch(`${apiBase}/api/quiz/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!r.ok) throw new Error(await r.text());
        const data: QuizResult = await r.json();
        setState({ phase: "result", data });
      } catch (e: unknown) {
        setState({ phase: "error", msg: e instanceof Error ? e.message : "Erreur réseau" });
      }
    }
  }

  if (state.phase === "loading") return <LoadingView />;
  if (state.phase === "error")   return <ErrorView msg={state.msg} onRetry={() => { setStep(0); setAnswers({}); setState({ phase: "quiz" }); }} />;
  if (state.phase === "result")  return <ResultView data={state.data} onRestart={() => { setStep(0); setAnswers({}); setState({ phase: "quiz" }); }} onShop={() => nav("/boutique")} />;

  const q = QUESTIONS[step];

  return (
    <div style={{ background: "var(--cz-bg)", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px" }}>

      <div style={{ width: "100%", maxWidth: 720, marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--cz-gold)",
            fontFamily: "sans-serif", letterSpacing: ".12em", textTransform: "uppercase" }}>
            Question {step + 1} sur {QUESTIONS.length}
          </span>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ background: "none", border: "none", color: "var(--cz-text3)",
                fontFamily: "sans-serif", fontSize: 12, cursor: "pointer",
                letterSpacing: ".05em" }}>
              Retour
            </button>
          )}
        </div>
        <div style={{ height: 2, background: "var(--cz-line)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--cz-gold)",
            width: `${((step + 1) / QUESTIONS.length) * 100}%`,
            transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      <h1 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 400,
        color: "var(--cz-text)", fontFamily: "serif", textAlign: "center",
        marginBottom: 48, maxWidth: 520, lineHeight: 1.3 }}>
        {q.question}
      </h1>

      <div style={{ display: "grid",
        gridTemplateColumns: q.options.length > 4
          ? "repeat(auto-fit, minmax(240px, 1fr))"
          : "repeat(auto-fit, minmax(270px, 1fr))",
        gap: 12, width: "100%", maxWidth: 720 }}>
        {q.options.map(opt => (
          <button key={opt.value} onClick={() => choose(opt.value)}
            style={{ background: "var(--cz-surface)", border: "0.5px solid var(--cz-line)",
              borderRadius: "var(--cz-r2)", padding: "22px 24px", cursor: "pointer",
              textAlign: "left", display: "flex", flexDirection: "column", gap: 6,
              transition: "all .18s ease" }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "var(--cz-gold)";
              el.style.background  = "var(--cz-goldbg)";
              el.style.transform   = "translateY(-2px)";
              el.style.boxShadow   = "var(--cz-s2)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "var(--cz-line)";
              el.style.background  = "var(--cz-surface)";
              el.style.transform   = "translateY(0)";
              el.style.boxShadow   = "none";
            }}>
            <span style={{ fontSize: 16, color: "var(--cz-text)",
              fontFamily: "serif", lineHeight: 1.3 }}>
              {opt.label}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--cz-text3)",
              fontFamily: "sans-serif", lineHeight: 1.5 }}>
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div style={{ background: "var(--cz-bg)", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 28, padding: "48px 24px" }}>
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid var(--cz-line)",
          borderTopColor: "var(--cz-gold)",
          animation: "spin 1s linear infinite",
        }} />
      </div>
      <p style={{ fontFamily: "serif", fontSize: 20, color: "var(--cz-text)",
        textAlign: "center", maxWidth: 340, lineHeight: 1.5 }}>
        Notre conseillère IA analyse votre profil...
      </p>
      <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "var(--cz-text3)",
        textAlign: "center" }}>
        Cela prend quelques secondes
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorView({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div style={{ background: "var(--cz-bg)", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20, padding: "48px 24px" }}>
      <p style={{ fontFamily: "serif", fontSize: 22, color: "var(--cz-text)", textAlign: "center" }}>
        Quelque chose s'est mal passé.
      </p>
      <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "var(--cz-text3)",
        maxWidth: 400, textAlign: "center" }}>
        {msg}
      </p>
      <button onClick={onRetry}
        style={{ marginTop: 8, background: "var(--cz-gold)", color: "var(--cz-btntxt)",
          border: "none", borderRadius: 999, padding: "12px 28px",
          fontFamily: "sans-serif", fontSize: 14, cursor: "pointer",
          fontWeight: 600, letterSpacing: ".04em" }}>
        Recommencer le quiz
      </button>
    </div>
  );
}

function ResultView({ data, onRestart, onShop }: { data: QuizResult; onRestart: () => void; onShop: () => void }) {
  const [, nav] = useLocation();
  return (
    <div style={{ background: "var(--cz-bg)", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "60px 24px 80px" }}>

      <div style={{ width: "100%", maxWidth: 700 }}>

        <p style={{ fontFamily: "sans-serif", fontSize: 11, color: "var(--cz-gold)",
          letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 16 }}>
          Votre sélection personnalisée
        </p>

        <h1 style={{ fontFamily: "serif", fontSize: "clamp(28px,5vw,42px)",
          fontWeight: 400, color: "var(--cz-text)", lineHeight: 1.2, marginBottom: 32 }}>
          Voici ce que je vous recommande
        </h1>

        <div style={{ background: "var(--cz-surface)", border: "0.5px solid var(--cz-gold)",
          borderRadius: "var(--cz-r2)", padding: "24px 28px", marginBottom: 48 }}>
          <p style={{ fontFamily: "sans-serif", fontSize: 15, color: "var(--cz-text)",
            lineHeight: 1.7, margin: 0 }}>
            {data.intro}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.recommendations.map((rec, i) => (
            <div key={rec.slug}
              style={{ background: "var(--cz-surface)", border: "0.5px solid var(--cz-line)",
                borderRadius: "var(--cz-r2)", padding: "24px 28px",
                display: "flex", gap: 20, alignItems: "flex-start",
                flexWrap: "wrap" }}>

              <div style={{ width: 36, height: 36, borderRadius: "50%",
                background: "var(--cz-goldbg)", border: "1px solid var(--cz-gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0 }}>
                <span style={{ fontFamily: "serif", fontSize: 16,
                  color: "var(--cz-gold)", fontWeight: 400 }}>
                  {i + 1}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8,
                  flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontFamily: "serif", fontSize: 18,
                    color: "var(--cz-text)", lineHeight: 1.2 }}>
                    {rec.name}
                  </span>
                  {rec.isBestseller && (
                    <span style={{ background: "var(--cz-gold)", color: "var(--cz-btntxt)",
                      fontSize: 10, fontFamily: "sans-serif", fontWeight: 700,
                      padding: "2px 8px", borderRadius: 999, letterSpacing: ".06em" }}>
                      BEST-SELLER
                    </span>
                  )}
                  {rec.isNew && (
                    <span style={{ background: "var(--cz-green)", color: "#fff",
                      fontSize: 10, fontFamily: "sans-serif", fontWeight: 700,
                      padding: "2px 8px", borderRadius: 999, letterSpacing: ".06em" }}>
                      NOUVEAU
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "sans-serif", fontSize: 12.5,
                  color: "var(--cz-text3)", margin: "0 0 8px",
                  textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {rec.category}{rec.cbdContent ? ` · ${rec.cbdContent}` : ""}
                </p>
                <p style={{ fontFamily: "sans-serif", fontSize: 14,
                  color: "var(--cz-text)", lineHeight: 1.6, margin: 0 }}>
                  {rec.reason}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column",
                alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: "serif", fontSize: 22,
                  color: "var(--cz-text)" }}>
                  {rec.price} €
                </span>
                <button
                  onClick={() => nav(`/produits/${rec.slug}`)}
                  style={{ background: "var(--cz-gold)", color: "var(--cz-btntxt)",
                    border: "none", borderRadius: 999, padding: "10px 20px",
                    fontFamily: "sans-serif", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", letterSpacing: ".04em",
                    whiteSpace: "nowrap" }}>
                  Voir le produit
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onShop}
            style={{ background: "var(--cz-gold)", color: "var(--cz-btntxt)",
              border: "none", borderRadius: 999, padding: "13px 30px",
              fontFamily: "sans-serif", fontSize: 14, fontWeight: 600,
              cursor: "pointer", letterSpacing: ".04em" }}>
            Voir toute la boutique
          </button>
          <button onClick={onRestart}
            style={{ background: "none", color: "var(--cz-text3)",
              border: "0.5px solid var(--cz-line)", borderRadius: 999,
              padding: "13px 30px", fontFamily: "sans-serif", fontSize: 14,
              cursor: "pointer", letterSpacing: ".04em" }}>
            Recommencer le quiz
          </button>
        </div>
      </div>
    </div>
  );
}
