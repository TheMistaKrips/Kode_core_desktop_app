import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, X, Inbox, Image as ImageIcon, 
  File, FileSpreadsheet, FileArchive, FileCode 
} from 'lucide-react';

const getFileIcon = (fileName) => {
  if (!fileName) return <File size={16} />;
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <ImageIcon size={16} />;
  if (['pdf'].includes(ext)) return <FileText size={16} />;
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return <File size={16} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={16} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive size={16} />;
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'cpp', 'c', 'java', 'cs'].includes(ext)) return <FileCode size={16} />;
  return <File size={16} />;
};

export default function ContextPanel({ selectedFiles, setSelectedFiles }) {
  const handleAddFiles = async () => {
    if (window.api && window.api.selectFiles) {
      const files = await window.api.selectFiles();
      if (files && files.length > 0) {
        setSelectedFiles(prev => {
          const uniqueFiles = Array.from(new Map([...prev, ...files].map(item => [item.path, item])).values());
          return uniqueFiles.slice(0, 5);
        });
      }
    }
  };

  const handleRemoveFile = (pathToRemove) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== pathToRemove));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: 0.1 }} 
      className="bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-5 flex-1 flex flex-col h-full min-h-0 overflow-hidden shadow-sm theme-transition z-10"
    >
      <div className="flex justify-between items-center mb-5 shrink-0">
        <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Контекст</h3>
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={handleAddFiles}
          className="p-1.5 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-[var(--text-main)] rounded-lg hover:bg-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:text-white transition-colors"
          title="Добавить файлы"
        >
          <Plus size={14} />
        </motion.button>
      </div>
      
      <div className="flex gap-4 border-b border-[var(--glass-border)] pb-2 mb-4 shrink-0">
        <button className="text-[var(--accent-primary)] text-xs font-semibold border-b-2 border-[var(--accent-primary)] pb-2 -mb-[9px]">
          Файлы ({selectedFiles.length}/5)
        </button>
      </div>
      
      <div className="flex flex-col gap-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
        {selectedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-70">
            <Inbox size={36} className="text-[var(--text-muted)] mb-4" />
            <span className="text-xs text-[var(--text-muted)] text-center leading-relaxed">Контекст пуст.<br/>Добавьте документы или код</span>
          </div>
        ) : (
          selectedFiles.map((file, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--glass-border)] transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-[var(--text-muted)] shrink-0 flex items-center justify-center">
                  {getFileIcon(file.name)}
                </div>
                <span className="text-sm text-[var(--text-main)] truncate font-medium" title={file.name}>{file.name}</span>
              </div>
              <button 
                onClick={() => handleRemoveFile(file.path)}
                className="text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}