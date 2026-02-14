import { useCallback, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileCheck, X, BookOpen, Clock } from 'lucide-react';

const PDFDropzone = memo(function PDFDropzone({ label, onFileSelect, file }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    onFileSelect(null);
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    if (!file) {
      document.getElementById(`file-input-${label}`)?.click();
    }
  }, [file, label]);

  const hasFile = !!file;
  const fileSize = file ? (file.size / 1024 / 1024).toFixed(2) : null;
  const isSyllabus = label.toLowerCase().includes('syllabus');
  const Icon = isSyllabus ? BookOpen : Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <label className="block text-sm font-medium text-zinc-300 mb-3">
        {label}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          glass-card glass-card-hover p-8 text-center cursor-pointer transition-all duration-200 relative
          ${isDragging ? 'border-white/20' : ''}
          ${hasFile ? 'border-white/15' : ''}
        `}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {hasFile ? (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center relative"
          >
            <button
              onClick={handleRemove}
              className="absolute top-0 right-0 p-2 glass-card hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4 text-zinc-400 hover:text-zinc-100" />
            </button>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <FileCheck className="w-12 h-12 text-zinc-300 mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-zinc-100 mb-1">{file.name}</p>
            <p className="text-xs text-zinc-500">{fileSize} MB</p>
            <div className="mt-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="text-xs text-zinc-300 font-medium">Ready</span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <motion.div
              animate={isDragging ? { y: [-4, 4, -4] } : {}}
              transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
            >
              <Icon className="w-12 h-12 text-zinc-500 mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-zinc-300 mb-1">
              Drop PDF here or click to upload
            </p>
            <p className="text-xs text-zinc-600">Only PDF files are accepted</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default PDFDropzone;
