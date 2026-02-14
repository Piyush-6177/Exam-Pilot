import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import PDFDropzone from './components/PDFDropzone';
import ProgressBar from './components/ProgressBar';
import ResultsDisplay from './components/ResultsDisplay';
import { analyzeExamStrategy } from './services/geminiService';
import { useMarkdownExport } from './hooks/useMarkdownExport';
import { Compass } from 'lucide-react';

const PROGRESS_STEPS = [
  'Step 1: Extracting PDFs',
  'Step 2: Analyzing documents with Gemini 3...',
  'Step 3: Generating Priority Matrix',
];

function App() {
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [pyqFile, setPyqFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [invalidDocumentType, setInvalidDocumentType] = useState(null); // Layer 3: INVALID_DOCUMENT friendly UI
  const { exportToMarkdown } = useMarkdownExport();

  const handleAnalyze = useCallback(async () => {
    if (!syllabusFile || !pyqFile) {
      setError('Please upload both syllabus and past year question papers');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setInvalidDocumentType(null);
    setAnalysis(null);
    setCurrentStep(PROGRESS_STEPS[0]);

    try {
      const result = await analyzeExamStrategy(
        syllabusFile,
        pyqFile,
        (step) => {
          setCurrentStep(step);
        }
      );
      setAnalysis(result);
      setCurrentStep(null);
    } catch (err) {
      if (err && err.code === 'INVALID_DOCUMENT') {
        setInvalidDocumentType(err.detectedType || 'non-academic document');
        setError('INVALID_DOCUMENT');
      } else {
        setInvalidDocumentType(null);
        setError(err.message || 'Failed to analyze documents. Please try again.');
      }
      setCurrentStep(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [syllabusFile, pyqFile]);

  const handleExport = useCallback(() => {
    exportToMarkdown(analysis);
  }, [analysis, exportToMarkdown]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setSyllabusFile(null);
    setPyqFile(null);
    setError(null);
    setInvalidDocumentType(null);
  }, []);

  const canAnalyze = useMemo(() => {
    return !isAnalyzing && syllabusFile && pyqFile;
  }, [isAnalyzing, syllabusFile, pyqFile]);

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-[600px] aurora-gradient opacity-60" />
      </div>

      {/* Floating Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      >
        <div className="glass-card px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-zinc-100" />
            <span className="text-xl font-semibold text-zinc-100">NITP Exam Pilot</span>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-6">
            NITP Exam Pilot: Smarter Study Strategy
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Cross-reference your syllabus with past exam papers to identify high-priority topics and optimize your study time.
          </p>
        </motion.section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {!analysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="space-y-8"
            >
              {/* Upload Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <PDFDropzone
                  label="Syllabus PDF"
                  onFileSelect={setSyllabusFile}
                  file={syllabusFile}
                />
                <PDFDropzone
                  label="Past Year Question Papers (PYQs)"
                  onFileSelect={setPyqFile}
                  file={pyqFile}
                />
              </div>

              {/* Progress Bar */}
              {isAnalyzing && currentStep && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-6"
                >
                  <ProgressBar currentStep={currentStep} steps={PROGRESS_STEPS} />
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={error === 'INVALID_DOCUMENT' ? 'p-4 rounded-xl border bg-red-950/50 border-red-900/50' : 'glass-card border-red-900/30 bg-red-900/10 p-4'}
                >
                  {error === 'INVALID_DOCUMENT' ? (
                    <p className="text-red-300 text-sm">
                      Oops! That looks like a <span className="font-semibold text-red-200">{invalidDocumentType || 'non-academic file'}</span>. Please upload a valid Syllabus or Past Question Papers.
                    </p>
                  ) : (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}
                </motion.div>
              )}

              {/* Analyze Button */}
              <div className="flex justify-center pt-4">
                <motion.button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  whileHover={canAnalyze ? { scale: 1.02 } : {}}
                  whileTap={canAnalyze ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.2 }}
                  className={`
                    ${canAnalyze ? 'primary-button' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50 rounded-full px-8 py-3'}
                  `}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Exam Strategy'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-zinc-100">Analysis Results</h2>
                <motion.button
                  onClick={handleReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="secondary-button"
                >
                  Start New Analysis
                </motion.button>
              </div>
              <ResultsDisplay analysis={analysis} onExport={handleExport} />
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-sm text-zinc-500">
              Powered by Gemini 3 Flash • Built for NIT Patna Students
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
