import { useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, Target, Zap } from 'lucide-react';

const ResultsDisplay = memo(function ResultsDisplay({ analysis, onExport }) {
  const sortedTopics = useMemo(() => {
    if (!analysis?.topics) return [];
    return [...analysis.topics].sort((a, b) => b.confidence - a.confidence);
  }, [analysis]);

  const getPriorityGlow = useCallback((priority) => {
    if (priority === 'High') return 'glow-red-subtle border-red-900/50';
    if (priority === 'Medium') return 'glow-amber-subtle border-amber-900/50';
    return 'glow-emerald-subtle border-emerald-900/50';
  }, []);

  const getPriorityFromConfidence = useCallback((confidence) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  }, []);

  if (!analysis) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Cards */}
      {analysis.summary && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="glass-card glass-card-hover p-6 text-center"
          >
            <div className="text-4xl font-bold text-zinc-100 mb-2">
              {analysis.summary.totalTopics}
            </div>
            <div className="text-sm text-zinc-400">Total Topics</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="glass-card glass-card-hover p-6 text-center glow-red-subtle border-red-900/50"
          >
            <div className="text-4xl font-bold text-zinc-100 mb-2">
              {analysis.summary.highPriorityCount}
            </div>
            <div className="text-sm text-zinc-400">High Priority</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="glass-card glass-card-hover p-6 text-center"
          >
            <div className="text-4xl font-bold text-zinc-100 mb-2">
              {analysis.summary.lowEffortHighReward}
            </div>
            <div className="text-sm text-zinc-400">Low Effort, High Reward</div>
          </motion.div>
        </motion.div>
      )}

      {/* Header with Export */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center"
      >
        <h3 className="text-2xl font-bold text-zinc-100">Priority List</h3>
        <motion.button
          onClick={onExport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="secondary-button flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Export as Markdown</span>
        </motion.button>
      </motion.div>

      {/* Priority Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {sortedTopics.map((topic, index) => {
          const priority = topic.priority || getPriorityFromConfidence(topic.confidence);
          const priorityGlow = getPriorityGlow(priority);
          const isLowEffortHighReward = topic.effort === 'Low' && topic.reward === 'High';
          
          return (
            <motion.div
              key={`${topic.name}-${index}`}
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ duration: 0.2 }}
              className={`
                glass-card glass-card-hover p-6 relative overflow-hidden
                ${priorityGlow}
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-zinc-100 pr-2 flex-1">
                  {topic.name}
                </h4>
                <div className="flex flex-col gap-2 items-end">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                    {topic.confidence}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityGlow} text-zinc-300`}>
                    {priority} Priority
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-card bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Effort</span>
                  </div>
                  <div className="text-sm font-semibold text-zinc-100">{topic.effort}</div>
                </div>
                <div className="glass-card bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Reward</span>
                  </div>
                  <div className="text-sm font-semibold text-zinc-100">{topic.reward}</div>
                </div>
                <div className="glass-card bg-white/5 p-3 rounded-lg col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Frequency</span>
                  </div>
                  <div className="text-sm font-semibold text-zinc-100">{topic.frequency}x appearances</div>
                </div>
              </div>

              {/* Low Effort High Reward Badge */}
              {isLowEffortHighReward && (
                <div className="mb-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg inline-flex items-center gap-2">
                  <Zap className="w-3 h-3 text-zinc-300" />
                  <span className="text-xs font-medium text-zinc-300">Low Effort, High Reward</span>
                </div>
              )}

              {/* Key Concepts */}
              {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-zinc-500 mb-2 block">Key Concepts:</span>
                  <div className="flex flex-wrap gap-2">
                    {topic.keyConcepts.slice(0, 3).map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/5 border border-white/10 text-zinc-300 rounded text-xs"
                      >
                        {concept}
                      </span>
                    ))}
                    {topic.keyConcepts.length > 3 && (
                      <span className="px-2 py-1 text-zinc-500 text-xs">
                        +{topic.keyConcepts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
});

export default ResultsDisplay;
