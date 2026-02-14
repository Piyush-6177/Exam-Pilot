import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProgressBar = memo(function ProgressBar({ currentStep, steps }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const currentIndex = steps.findIndex(step => step === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (currentStep) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [currentStep]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: index <= currentIndex ? 1 : 0.4 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`flex-1 text-center text-sm ${
              index <= currentIndex 
                ? 'text-zinc-100 font-medium' 
                : 'text-zinc-600'
            }`}
          >
            {step}
          </motion.div>
        ))}
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ willChange: 'transform' }}
          />
        </motion.div>
      </div>
      
      {/* Loading indicator and time */}
      {currentStep && (
        <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing... {elapsedTime > 0 && `(${formatTime(elapsedTime)})`}</span>
        </div>
      )}
    </div>
  );
});

export default ProgressBar;
