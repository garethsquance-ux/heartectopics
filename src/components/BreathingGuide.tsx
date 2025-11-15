import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const BreathingGuide = () => {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const phases = {
      inhale: { duration: 4, next: "hold" as const },
      hold: { duration: 4, next: "exhale" as const },
      exhale: { duration: 6, next: "inhale" as const },
    };

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const currentPhase = phases[phase];
          setPhase(currentPhase.next);
          return phases[currentPhase.next].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const getInstruction = () => {
    switch (phase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
    }
  };

  const getScale = () => {
    switch (phase) {
      case "inhale":
        return 1.5;
      case "hold":
        return 1.5;
      case "exhale":
        return 0.8;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <motion.div
        className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60"
        animate={{
          scale: getScale(),
        }}
        transition={{
          duration: phase === "inhale" ? 4 : phase === "hold" ? 0.5 : 6,
          ease: "easeInOut",
        }}
      />
      
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold text-primary">{getInstruction()}</p>
        <p className="text-6xl font-bold text-foreground">{countdown}</p>
        <p className="text-sm text-muted-foreground">Follow the circle</p>
      </div>
    </div>
  );
};

export default BreathingGuide;
