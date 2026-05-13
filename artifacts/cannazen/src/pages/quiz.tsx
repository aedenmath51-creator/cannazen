import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetQuizResult } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Leaf, Sparkles, Moon, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  {
    id: "goal",
    title: "Quel est votre objectif principal ?",
    options: [
      { id: "relax", label: "Me détendre profondément", icon: Leaf },
      { id: "sleep", label: "Mieux dormir", icon: Moon },
      { id: "focus", label: "Améliorer ma concentration", icon: ShieldCheck },
      { id: "energy", label: "Retrouver de l'énergie", icon: Sparkles }
    ]
  },
  {
    id: "experience",
    title: "Quelle est votre expérience avec le CBD ?",
    options: [
      { id: "beginner", label: "Je découvre" },
      { id: "intermediate", label: "Consommateur occasionnel" },
      { id: "advanced", label: "Consommateur régulier" }
    ]
  },
  {
    id: "format",
    title: "Quel format préférez-vous ?",
    options: [
      { id: "flower", label: "Fleurs à infuser" },
      { id: "oil", label: "Huiles sublinguales" },
      { id: "resin", label: "Résines" },
      { id: "vape", label: "Vaporisateurs" }
    ]
  }
];

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();

  const getQuizResult = useGetQuizResult();

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: optionId };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      // Map answers to one of the 4 moods supported by API
      let mood: 'serenity' | 'energy' | 'sleep' | 'focus' = 'serenity';
      if (newAnswers.goal === 'sleep') mood = 'sleep';
      else if (newAnswers.goal === 'focus') mood = 'focus';
      else if (newAnswers.goal === 'energy') mood = 'energy';

      // Pass all 3 answers so backend can do AI-driven personalization
      getQuizResult.mutate({
        data: {
          mood,
          goal: newAnswers.goal ?? null,
          experience: newAnswers.experience ?? null,
          format: newAnswers.format ?? null,
        },
      });
      setStep(step + 1); // Move to results step
    }
  };

  // Render Results
  if (step >= QUESTIONS.length) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-6 py-24 min-h-[80vh]"
      >
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="w-16 h-16 mx-auto bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center mb-8">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-5xl mb-6 italic text-foreground">Votre Rituel Personnalisé</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            D'après vos réponses, voici les créations botaniques que le concierge a sélectionnées spécifiquement pour vous.
          </p>
        </div>

        {getQuizResult.isPending ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : getQuizResult.data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
              {getQuizResult.data.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <Button asChild size="lg" className="bg-transparent text-primary border border-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-widest uppercase text-sm h-14 px-10 rounded-full transition-all duration-500">
                <Link href="/boutique">Explorer toute la galerie</Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-destructive p-8 bg-destructive/10 rounded-2xl border border-destructive/20 max-w-xl mx-auto">
            Une erreur est survenue lors de l'analyse de vos réponses.
          </div>
        )}
      </motion.div>
    );
  }

  // Render Questions
  const currentQuestion = QUESTIONS[step];

  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl min-h-[80vh] flex flex-col justify-center relative">
      {/* Background glow specific to quiz */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="mb-16 max-w-xl mx-auto w-full text-center">
        <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-6">
          Question {step + 1} sur {QUESTIONS.length}
        </div>
        <div className="h-1 bg-background border border-border/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl mb-12">{currentQuestion.title}</h2>
          
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {currentQuestion.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`p-8 rounded-3xl border text-left flex items-center gap-6 transition-all duration-300 group
                  ${answers[currentQuestion.id] === option.id 
                    ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(201,168,76,0.15)] scale-[1.02]' 
                    : 'border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card/80 inner-shadow-subtle'}`}
              >
                {"icon" in option && option.icon ? (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors
                    ${answers[currentQuestion.id] === option.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background/50 border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30'}`}
                  >
                    <option.icon className="h-6 w-6" />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors font-serif text-xl italic
                    ${answers[currentQuestion.id] === option.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background/50 border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30'}`}
                  >
                    {option.id.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-serif text-2xl group-hover:text-primary transition-colors">{option.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center mt-auto">
        <Button 
          variant="ghost" 
          onClick={() => setStep(Math.max(0, step - 1))}
          className={`font-sans uppercase tracking-widest text-xs text-muted-foreground hover:text-primary rounded-full px-6 h-12 ${step === 0 ? "invisible" : "visible"}`}
        >
          <ArrowLeft className="mr-3 h-4 w-4" /> Revenir à la question précédente
        </Button>
      </div>
    </div>
  );
}
