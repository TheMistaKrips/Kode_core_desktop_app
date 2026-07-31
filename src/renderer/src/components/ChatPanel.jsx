import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

import iconNewChat from '../assets/icon_new_chat.svg';
import iconSearch from '../assets/icon_search.svg';
import iconLibrary from '../assets/icon_library.svg';
import iconPlus from '../assets/icon_plus.svg';
import iconMic from '../assets/icon_mic.svg';
import iconSendFill from '../assets/icon_send_up.svg';
import iconSendOutline from '../assets/icon_send_up_outline.svg';
import iconScrollTop from '../assets/icon_scroll_top.svg';
import iconCopy from '../assets/icon_copy.svg';
import iconDownload from '../assets/icon_download.svg';
import iconFile from '../assets/icon_library.svg';
import iconWebSearch from '../assets/icon_web_search.svg';
import iconShare from '../assets/icon_share.svg';
import iconPin from '../assets/icon_pin.svg';
import iconRename from '../assets/icon_rename.svg';
import iconDelete from '../assets/icon_delete.svg';

import voiceSoundFile from '../assets/voice.mp3';
const voiceAudio = new Audio(voiceSoundFile);
voiceAudio.volume = 0.6;

// ============================================================
// КОМПОНЕНТ: БЛОК КОДА
// ============================================================

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const ext = match ? match[1] : 'txt';
    const extMap = {
      'python': 'py',
      'javascript': 'js',
      'typescript': 'ts',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'bash': 'sh',
      'shell': 'sh',
      'sql': 'sql',
      'yaml': 'yml',
      'markdown': 'md'
    };
    const finalExt = extMap[ext] || ext;
    const file = new Blob([codeString], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `code_snippet.${finalExt}`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  if (!inline && match) {
    return (
      <div className="my-4 overflow-hidden border border-[var(--color-input)] bg-[var(--color-white)]" style={{ borderRadius: '20px' }}>
        <div className="bg-[var(--color-input)] px-6 py-3 flex justify-between items-center">
          <span className="text-[10px] font-bold text-[var(--color-black)]/60 uppercase tracking-wider">
            {match[1]}
          </span>
          <div className="flex gap-4">
            <button onClick={handleCopy} className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-black)] hover:opacity-70 transition-opacity">
              <img src={iconCopy} alt="Copy" className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-black)] hover:opacity-70 transition-opacity">
              <img src={iconDownload} alt="Download" className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
        <div className="p-6 overflow-x-auto custom-scrollbar bg-[#f8f9fa]">
          <pre className="text-[12px] font-mono text-[var(--color-black)] whitespace-pre-wrap break-words">
            <code>{codeString}</code>
          </pre>
        </div>
      </div>
    );
  }
  return <code {...props} className={`${className} bg-[var(--color-input)] rounded-lg px-2 py-1 text-[12px] font-mono text-[var(--color-black)]`}>{children}</code>;
};

// ============================================================
// КОМПОНЕНТ: ТАБЛИЦА
// ============================================================

const TableRenderer = ({ data, onExport }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="my-4">
      <div className="overflow-x-auto border border-black/10" style={{ borderRadius: '16px' }}>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-black/5">
              {Object.keys(data[0]).map((key, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold text-[var(--color-black)] border-b border-black/10">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white/50' : 'bg-white/20'}>
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-4 py-3 border-b border-black/5 break-words max-w-[200px]">
                    {typeof val === 'number' ? val.toFixed(2) : String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button
        onClick={onExport}
        className="mt-3 px-4 py-2 bg-[var(--color-black)] text-[var(--color-white)] text-[11px] font-bold hover:opacity-80 transition-opacity rounded-full flex items-center gap-2"
      >
        <img src={iconDownload} alt="Download" className="w-4 h-4" />
        Export to Excel
      </button>
    </div>
  );
};

// ============================================================
// КОМПОНЕНТ: WEB SEARCH RESULTS (СВОРАЧИВАЕМЫЙ)
// ============================================================

const WebSearchResults = ({ results }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!results || results.length === 0) return null;
  
  return (
    <div className="mt-6 pt-6 border-t border-black/5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-black)]/50 uppercase tracking-widest hover:text-[var(--color-black)] transition-colors"
      >
        <img src={iconWebSearch} alt="Web" className="w-4 h-4" />
        Web Search Results ({results.length})
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isOpen && (
        <div className="flex flex-col gap-3 mt-3">
          {results.map((result, i) => (
            <div key={i} className="p-4 border border-black/10 hover:bg-black/5 transition-colors break-words" style={{ borderRadius: '16px' }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="block">
                <h4 className="text-[12px] font-bold text-[var(--color-black)] hover:underline break-words">{result.title}</h4>
                <p className="text-[11px] text-[var(--color-black)]/60 mt-1 break-words">{result.snippet}</p>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ: CHAT PANEL
// ============================================================

export default function ChatPanel({ 
  selectedFiles, setSelectedFiles, userName, aiName,
  chatSessions, setChatSessions, currentSessionId, setCurrentSessionId, playClick 
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  
  const [editingChatId, setEditingChatId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [showFileDropZone, setShowFileDropZone] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  
  const [responseTime, setResponseTime] = useState(null);
  const responseStartTime = useRef(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // ============================================================
  // БУРГЕР-МЕНЮ + ЦЕНТРИРОВАННЫЙ ИНПУТ
  // ============================================================
  
  const [isChatListOpen, setIsChatListOpen] = useState(true);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isHoveringBurger, setIsHoveringBurger] = useState(false);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);

  const abortControllerRef = useRef(null);

  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const attachMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const textareaRef = useRef(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId) || chatSessions[0];
  const currentMessages = currentSession?.messages || [];

  // ============================================================
  // ОТСЛЕЖИВАНИЕ ПЕРВОГО СООБЩЕНИЯ
  // ============================================================

  useEffect(() => {
    if (currentMessages.length > 0) {
      setIsFirstMessage(false);
      setHasSentFirstMessage(true);
    }
  }, [currentMessages]);

  // ============================================================
  // ГОРЯЧИЕ КЛАВИШИ
  // ============================================================
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape') {
        if (isGenerating) {
          handleAbort();
        }
        if (isAttachMenuOpen) setIsAttachMenuOpen(false);
        if (isKnowledgeOpen) setIsKnowledgeOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
        if (activeMenuId) setActiveMenuId(null);
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        if (window.electron?.openDevTools) {
          window.electron.openDevTools();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, isAttachMenuOpen, isKnowledgeOpen, isSearchOpen, activeMenuId]);

  // ============================================================
  // ЗАГРУЗКА СОХРАНЁННЫХ ЧАТОВ
  // ============================================================
  
  useEffect(() => {
    if (window.api && window.api.getChats) {
      window.api.getChats().then(chats => {
        if (chats && chats.length > 0) {
          setChatSessions(chats);
          if (window.api && window.api.getCurrentSession) {
            window.api.getCurrentSession().then(session => {
              if (session) {
                setCurrentSessionId(session.id);
              }
            });
          }
        }
      });
    }
  }, []);

  // ============================================================
  // ПОДПИСКА НА СТРИМИНГ
  // ============================================================
  
  useEffect(() => {
    if (window.api && window.api.onChatToken) {
      window.api.onChatToken((data) => {
        if (data.chatId === currentSessionId) {
          setStreamingMessage(data.text);
          
          if (!isStreaming) {
            setIsStreaming(true);
            setIsLoading(false);
          }
          
          setTimeout(() => scrollToBottom(), 10);
        }
      });
    }
    
    return () => {
      if (window.api && window.api.removeChatTokenListener) {
        window.api.removeChatTokenListener();
      }
    };
  }, [currentSessionId]);

  // ============================================================
  // DRAG & DROP
  // ============================================================
  
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setShowFileDropZone(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      setShowFileDropZone(false);
    };
    
    const handleDrop = async (e) => {
      e.preventDefault();
      setShowFileDropZone(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const newFiles = files.map(f => ({ 
          path: f.path, 
          name: f.name,
          type: f.type,
          size: f.size
        }));
        setSelectedFiles(prev => {
          const combined = [...prev, ...newFiles];
          const unique = Array.from(new Map(combined.map(item => [item.path, item])).values());
          return unique.slice(0, 10);
        });
      }
    };
    
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // ============================================================
  // ПОИСК ПО ЧАТАМ
  // ============================================================
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = chatSessions.filter(session => {
        const titleMatch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
        const messageMatch = session.messages.some(msg => 
          msg.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return titleMatch || messageMatch;
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, chatSessions]);

  // ============================================================
  // KNOWLEDGE BASE
  // ============================================================
  
  useEffect(() => {
    if (window.api && window.api.getKnowledgeBase) {
      window.api.getKnowledgeBase().then(items => {
        setKnowledgeItems(items || []);
      });
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (playClick) playClick();
  };

  useEffect(() => scrollToBottom(), [currentMessages, isLoading, streamingMessage]);

  // ============================================================
  // ГОЛОСОВОЙ ВВОД
  // ============================================================
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (playClick) playClick();
    if (!recognitionRef.current) return alert('Голосовой ввод не поддерживается.');
    voiceAudio.currentTime = 0;
    voiceAudio.play().catch(() => {});
    
    if (isListening) recognitionRef.current.stop();
    else { setInput(''); recognitionRef.current.start(); }
  };

  const handleAddFiles = async () => {
    if (playClick) playClick();
    setIsAttachMenuOpen(false);
    if (window.api && window.api.selectFiles) {
      const files = await window.api.selectFiles();
      if (files && files.length > 0) {
        setSelectedFiles(prev => {
          const combined = [...prev, ...files];
          const unique = Array.from(new Map(combined.map(item => [item.path, item])).values());
          return unique.slice(0, 10);
        });
      }
    }
  };

  const updateCurrentSession = (updater) => {
    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: typeof updater === 'function' ? updater(session.messages) : updater };
      }
      return session;
    }));
  };

  const handleCreateNewChat = async () => {
    if (playClick) playClick();
    if (window.api && window.api.createNewChat) {
      const newChat = await window.api.createNewChat('New chat');
      if (newChat) {
        setChatSessions(prev => [newChat, ...prev]);
        setCurrentSessionId(newChat.id);
        setSelectedFiles([]);
        setSearchQuery('');
        setStreamingMessage('');
        setIsStreaming(false);
        setInput('');
        setResponseTime(null);
        setIsFirstMessage(true);
        setHasSentFirstMessage(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleSwitchChat = (id) => {
    if (playClick) playClick();
    setCurrentSessionId(id);
    setSelectedFiles([]);
    setSearchQuery('');
    setStreamingMessage('');
    setIsStreaming(false);
    setInput('');
    setResponseTime(null);
    setIsFirstMessage(currentSession?.messages?.length === 0);
    setHasSentFirstMessage(currentSession?.messages?.length > 0);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    if (playClick) playClick();
    
    if (activeMenuId === id) {
      setActiveMenuId(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right + 15 });
    setActiveMenuId(id);
  };

  const handleShare = async (e, session) => {
    e.stopPropagation();
    if (playClick) playClick();
    setActiveMenuId(null);
    
    const chatText = session.messages.map(m => `${m.role === 'user' ? userName : aiName}:\n${m.text}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(`Chat: ${session.title}\n\n${chatText}`);
      alert('Чат скопирован в буфер обмена!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleTogglePin = async (e, id) => {
    e.stopPropagation();
    if (playClick) playClick();
    if (window.api && window.api.togglePinChat) {
      await window.api.togglePinChat(id);
      const updatedChats = await window.api.getChats();
      setChatSessions(updatedChats);
    }
    setActiveMenuId(null);
  };

  const handleRenameStart = (e, id, currentTitle) => {
    e.stopPropagation();
    if (playClick) playClick();
    setTempTitle(currentTitle);
    setEditingChatId(id);
    setActiveMenuId(null);
  };

  const handleRenameSave = async (id) => {
    if (tempTitle.trim()) {
      if (window.api && window.api.updateChatTitle) {
        await window.api.updateChatTitle(id, tempTitle.trim());
        const updatedChats = await window.api.getChats();
        setChatSessions(updatedChats);
      }
    }
    setEditingChatId(null);
  };

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    if (playClick) playClick();
    
    if (window.api && window.api.deleteChat) {
      await window.api.deleteChat(id);
      const updatedChats = await window.api.getChats();
      setChatSessions(updatedChats);
      if (updatedChats.length > 0) {
        setCurrentSessionId(updatedChats[0].id);
      }
    }
    setActiveMenuId(null);
  };

  // ============================================================
  // ОТМЕНА ЗАПРОСА
  // ============================================================
  
  const handleAbort = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setIsLoading(false);
      setIsStreaming(false);
      
      if (window.api && window.api.abortGeneration) {
        await window.api.abortGeneration();
      }
      
      setInput(pendingQuestion);
      setPendingQuestion('');
      setResponseTime(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      updateCurrentSession(prev => {
        const filtered = prev.filter(m => !m.isStreaming);
        return [
          ...filtered,
          { 
            role: 'ai', 
            text: 'Генерация отменена пользователем',
            files: [],
            tableData: null,
            webResults: []
          }
        ];
      });
    }
  };

  // ============================================================
  // ЭКСПОРТ ТАБЛИЦЫ
  // ============================================================
  
  const handleExportTable = async (data, fileName) => {
    if (window.api && window.api.exportTableToExcel) {
      const result = await window.api.exportTableToExcel(data, fileName);
      if (result.success) {
        alert(`Таблица сохранена: ${result.path}`);
      } else if (result.error) {
        alert(`Ошибка: ${result.error}`);
      }
    }
  };

  // ============================================================
  // СОХРАНЕНИЕ ФАЙЛА
  // ============================================================
  
  const handleSaveGeneratedFile = async (file) => {
    if (window.api && window.api.createFile) {
      const result = await window.api.createFile(file.name, file.content);
      if (result.success) {
        alert(`Файл сохранен: ${result.path}`);
      } else if (result.error) {
        alert(`Ошибка: ${result.error}`);
      }
    }
  };

  // ============================================================
  // COPY ОТВЕТА
  // ============================================================
  
  const handleCopyResponse = (text) => {
    navigator.clipboard.writeText(text);
    alert('Ответ скопирован в буфер обмена!');
  };

  // ============================================================
  // KNOWLEDGE BASE
  // ============================================================
  
  const handleAddToKnowledge = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first');
      return;
    }
    
    if (window.api && window.api.addToKnowledgeBase) {
      const result = await window.api.addToKnowledgeBase(selectedFiles);
      if (result.success) {
        setKnowledgeItems(prev => [...prev, ...result.items]);
        alert(`Added ${result.items.length} items to Knowledge Base`);
        setSelectedFiles([]);
        setIsAttachMenuOpen(false);
      }
    }
  };

  const handleSearchKnowledge = async () => {
    if (!knowledgeSearchQuery.trim()) return;
    if (window.api && window.api.searchKnowledgeBase) {
      const results = await window.api.searchKnowledgeBase(knowledgeSearchQuery);
      if (results.length > 0) {
        const text = results.map(r => `Knowledge: ${r.title}\n${r.content.substring(0, 300)}...\n`).join('\n');
        updateCurrentSession(prev => [...prev, { 
          role: 'ai', 
          text: `Knowledge Base Search Results:\n\n${text}` 
        }]);
      } else {
        updateCurrentSession(prev => [...prev, { 
          role: 'ai', 
          text: 'No results found in Knowledge Base.' 
        }]);
      }
      setIsKnowledgeOpen(false);
      setKnowledgeSearchQuery('');
    }
  };

  // ============================================================
  // ОТПРАВКА СООБЩЕНИЯ
  // ============================================================
  
  const handleSend = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;
    if (playClick) playClick();
    if (isListening) recognitionRef.current?.stop();
    
    const userText = input.trim();
    
    setPendingQuestion(userText);
    
    setInput('');
    setResponseTime(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // 🔥 ПЕРВОЕ СООБЩЕНИЕ — СКРЫВАЕМ ПАНЕЛЬ ЧАТОВ И ЦЕНТРИРУЕМ ИНПУТ
    setIsFirstMessage(false);
    setHasSentFirstMessage(true);
    
    const isFirstMsg = currentMessages.length <= 1 && currentSession?.title === 'New chat';
    const currentContextFiles = [...selectedFiles];
    
    const userMessage = { 
      role: 'user', 
      text: userText || '[Files attached]', 
      contextFiles: currentContextFiles,
      webSearch: isWebSearchEnabled
    };
    
    const updatedMessages = [...currentMessages, userMessage];
    updateCurrentSession(updatedMessages);
    
    setIsLoading(true);
    setIsGenerating(true);
    setStreamingMessage('');
    setIsStreaming(false);
    
    responseStartTime.current = Date.now();

    abortControllerRef.current = new AbortController();

    if (isFirstMsg && window.api && window.api.generateChatTitle && userText) {
      window.api.generateChatTitle(userText, currentSessionId).then(newTitle => {
        if (newTitle) {
          setChatSessions(prev => prev.map(session => 
            session.id === currentSessionId ? { ...session, title: newTitle } : session
          ));
        }
      }).catch(() => {});
    }

    try {
      if (window.api && window.api.sendChatMessage) {
        const response = await window.api.sendChatMessage(
          userText, 
          currentContextFiles, 
          userName, 
          aiName, 
          currentSessionId, 
          updatedMessages,
          isWebSearchEnabled
        );
        
        let aiResponse;
        try { 
          aiResponse = typeof response === 'string' ? JSON.parse(response) : response; 
        } catch { 
          aiResponse = { text: response, files: [], tableData: null, webResults: [] }; 
        }
        
        if (aiResponse.cancelled) {
          setInput(pendingQuestion);
          setPendingQuestion('');
          setResponseTime(null);
          updateCurrentSession(prev => {
            const filtered = prev.filter(m => !m.isStreaming);
            return [
              ...filtered,
              { 
                role: 'ai', 
                text: 'Генерация отменена пользователем',
                files: [],
                tableData: null,
                webResults: []
              }
            ];
          });
          setIsLoading(false);
          setIsGenerating(false);
          setIsStreaming(false);
          return;
        }
        
        const finalText = aiResponse.text || response;
        const finalFiles = aiResponse.files || [];
        const finalTableData = aiResponse.tableData || null;
        const finalWebResults = aiResponse.webResults || [];
        
        const elapsed = responseStartTime.current ? ((Date.now() - responseStartTime.current) / 1000).toFixed(1) : null;
        setResponseTime(elapsed);
        
        updateCurrentSession(prev => {
          const filtered = prev.filter(m => !m.isStreaming);
          return [
            ...filtered, 
            { 
              role: 'ai', 
              text: finalText,
              files: finalFiles,
              tableData: finalTableData,
              webResults: finalWebResults,
              responseTime: elapsed
            }
          ];
        });
        
        setStreamingMessage('');
        setIsStreaming(false);
        setIsLoading(false);
        setIsGenerating(false);
        
        setSelectedFiles([]);
        setPendingQuestion('');
        
        if (window.api && window.api.getChats) {
          const updated = await window.api.getChats();
          setChatSessions(updated);
        }
        
      } else {
        updateCurrentSession(prev => [...prev, { role: 'ai', text: 'API Error' }]);
        setIsLoading(false);
        setIsGenerating(false);
        setPendingQuestion('');
        setResponseTime(null);
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        setInput(pendingQuestion);
        setPendingQuestion('');
        setResponseTime(null);
        updateCurrentSession(prev => {
          const filtered = prev.filter(m => !m.isStreaming);
          return [
            ...filtered,
            { 
              role: 'ai', 
              text: 'Генерация отменена пользователем',
              files: [],
              tableData: null,
              webResults: []
            }
          ];
        });
      } else {
        console.error('Send error:', error);
        updateCurrentSession(prev => [...prev, { role: 'ai', text: 'System Error: ' + error.message }]);
      }
      setIsLoading(false);
      setIsGenerating(false);
      setIsStreaming(false);
      setPendingQuestion('');
      setResponseTime(null);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const sortedSessions = [...chatSessions].sort((a, b) => {
    if (a.pinned === b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  const displayedSessions = searchQuery.trim() ? searchResults : sortedSessions;

  // ============================================================
  // RENDER
  // ============================================================
  
  return (
    <div className="w-full h-full flex gap-0 min-h-0 relative">
      
      {/* 🔥 БУРГЕР-МЕНЮ (когда панель скрыта) */}
      {!isChatListOpen && !isFirstMessage && (
        <button
          onClick={() => setIsChatListOpen(true)}
          onMouseEnter={() => setIsHoveringBurger(true)}
          onMouseLeave={() => setIsHoveringBurger(false)}
          className="absolute top-4 left-4 z-30 w-10 h-10 bg-white rounded-full shadow-md flex flex-col items-center justify-center gap-1.5 hover:scale-105 transition-transform"
        >
          <span className={`w-4 h-0.5 bg-black rounded-full transition-all ${isHoveringBurger ? 'w-5' : ''}`}></span>
          <span className={`w-4 h-0.5 bg-black rounded-full transition-all ${isHoveringBurger ? 'w-5' : ''}`}></span>
          <span className={`w-4 h-0.5 bg-black rounded-full transition-all ${isHoveringBurger ? 'w-5' : ''}`}></span>
        </button>
      )}

      {/* ЛЕВАЯ ПАНЕЛЬ — СПИСОК ЧАТОВ (СВОРАЧИВАЕМАЯ) */}
      <motion.div 
        className="h-full flex-shrink-0 relative"
        initial={{ width: 320 }}
        animate={{ width: isChatListOpen && !isFirstMessage ? 320 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="w-[320px] bg-[var(--color-white)] h-full flex flex-col p-6 shadow-lg relative" style={{ borderRadius: 'var(--radius-main)' }}>
          
          {/* КНОПКА СВОРАЧИВАНИЯ НА САМОМ БЛОКЕ */}
          {!isFirstMessage && (
            <button
              onClick={() => setIsChatListOpen(false)}
              className="absolute top-4 right-4 z-30 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          
          <div className="flex flex-col gap-4 mb-6 shrink-0">
            <button onClick={handleCreateNewChat} className="flex items-center gap-4 text-[12px] text-[var(--color-black)] hover:opacity-60 transition-opacity w-full text-left font-medium">
              <img src={iconNewChat} alt="New chat" className="w-5 h-5" />
              New chat
            </button>
            
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-[var(--color-input)] px-4 py-2" style={{ borderRadius: '20px' }}>
                  <img src={iconSearch} alt="Search" className="w-4 h-4 opacity-50" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--color-black)] placeholder:text-[var(--color-black)]/50"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="hover:opacity-50 text-xl">×</button>
                </div>
              ) : (
                <button onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="flex items-center gap-4 text-[12px] text-[var(--color-black)] hover:opacity-60 transition-opacity w-full text-left font-medium">
                  <img src={iconSearch} alt="Search chats" className="w-5 h-5" />
                  Search chats
                </button>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsKnowledgeOpen(!isKnowledgeOpen)}
                className="flex items-center gap-4 text-[12px] text-[var(--color-black)] hover:opacity-60 transition-opacity w-full text-left font-medium"
              >
                <img src={iconLibrary} alt="Knowledge" className="w-5 h-5" />
                Knowledge Base
              </button>
              
              <AnimatePresence>
                {isKnowledgeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 w-full bg-white shadow-xl p-4 mt-1 z-50"
                    style={{ borderRadius: '20px', border: '1px solid var(--color-input)' }}
                  >
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={knowledgeSearchQuery}
                        onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearchKnowledge(); }}
                        placeholder="Search in knowledge..."
                        className="flex-1 bg-[var(--color-input)] px-3 py-2 text-[12px] rounded-full border-none outline-none"
                      />
                      <button 
                        onClick={handleSearchKnowledge}
                        className="px-4 py-2 bg-[var(--color-black)] text-[var(--color-white)] text-[12px] rounded-full"
                      >
                        Search
                      </button>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto hidden-scroll">
                      {knowledgeItems.length > 0 ? (
                        knowledgeItems.slice(0, 5).map((item, i) => (
                          <div key={i} className="p-2 hover:bg-black/5 rounded-lg cursor-pointer text-[12px]">
                            <div className="font-bold truncate">{item.title}</div>
                            <div className="text-black/60 text-[11px] truncate">{item.content.substring(0, 80)}...</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[12px] text-black/40 text-center py-4">
                          No knowledge items yet.
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleAddToKnowledge}
                      className="mt-3 w-full py-2 bg-black/5 text-black text-[12px] rounded-lg hover:bg-black/10 transition-colors"
                    >
                      + Add Documents
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={() => { if(playClick) playClick(); }} className="flex items-center gap-4 text-[12px] text-[var(--color-black)] hover:opacity-60 transition-opacity w-full text-left font-medium">
              <img src={iconLibrary} alt="Library" className="w-5 h-5" />
              Library
            </button>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <span className="text-[10px] text-[var(--color-black)] opacity-50 mb-4 px-2 shrink-0 uppercase tracking-widest">
              {searchQuery.trim() ? `Results (${displayedSessions.length})` : 'Recent'}
            </span>
            <div className="flex-1 overflow-y-auto hidden-scroll flex flex-col gap-2 min-h-0 pb-4">
              {displayedSessions.map(session => (
                <div key={session.id} className="relative group chat-menu-container flex items-center">
                  {editingChatId === session.id ? (
                    <input
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={() => handleRenameSave(session.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(session.id); }}
                      autoFocus
                      className="w-full bg-[var(--color-input)] text-[var(--color-black)] px-4 py-3 text-[12px] outline-none shadow-inner"
                      style={{ borderRadius: '20px' }}
                    />
                  ) : (
                    <button
                      onClick={() => handleSwitchChat(session.id)}
                      className={`w-full text-left px-4 py-3 text-[12px] transition-all shrink-0 flex items-center justify-between ${currentSessionId === session.id ? 'bg-[var(--color-input)] text-[var(--color-black)]' : 'text-[var(--color-black)] hover:bg-black/5'}`}
                      style={{ borderRadius: '20px' }}
                    >
                      <span className="truncate block pr-6">
                        {session.title}
                      </span>
                    </button>
                  )}

                  {!editingChatId && (
                    <button 
                      onClick={(e) => handleMenuClick(e, session.id)}
                      className={`absolute right-3 p-2 rounded-full hover:bg-black/10 transition-colors ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} text-[var(--color-black)]/60 hover:text-[var(--color-black)]`}
                    >
                      <span className="text-xl leading-none">•••</span>
                    </button>
                  )}
                  
                  {activeMenuId === session.id && createPortal(
                    <div
                      className="fixed z-[9999] w-[220px] bg-[var(--color-black)] shadow-2xl overflow-hidden chat-portal-menu"
                      style={{ top: menuPos.top, left: menuPos.left, borderRadius: '24px' }}
                    >
                      <div className="flex flex-col py-2">
                        <button onClick={(e) => handleShare(e, session)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-[var(--color-white)] text-[14px] font-medium">
                          <img src={iconShare} alt="Share" className="w-5 h-5 invert" />
                          Share Chat
                        </button>
                        <button onClick={(e) => handleTogglePin(e, session.id)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-[var(--color-white)] text-[14px] font-medium">
                          <img src={iconPin} alt="Pin" className="w-5 h-5 invert" />
                          {session.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={(e) => handleRenameStart(e, session.id, session.title)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-[var(--color-white)] text-[14px] font-medium">
                          <img src={iconRename} alt="Rename" className="w-5 h-5 invert" />
                          Rename
                        </button>
                        <div className="h-[1px] w-full bg-white/10 my-1" />
                        <button onClick={(e) => handleDeleteChat(e, session.id)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors text-red-500 text-[14px] font-medium">
                          <img src={iconDelete} alt="Delete" className="w-5 h-5 invert" />
                          Delete
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ОСНОВНАЯ ОБЛАСТЬ — ЧАТ */}
      <div className="flex-1 flex flex-col h-full relative min-h-0">
        
        {/* 🔥 СТАТУС ИНТЕРНЕТА + КНОПКА SCROLL */}
        <div className="absolute top-0 right-0 z-20 flex gap-2 items-center">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-medium ${isOnline ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <button onClick={scrollToTop} className="w-[50px] h-[50px] bg-[var(--color-white)] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md">
            <img src={iconScrollTop} alt="Top" className="w-5 h-5" />
          </button>
        </div>

        {/* СООБЩЕНИЯ — отображаются только после первого сообщения */}
        <div className={`flex-1 overflow-y-auto hidden-scroll flex flex-col gap-4 pb-6 pt-2 min-h-0 px-6 ${!hasSentFirstMessage ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`} ref={messagesContainerRef}>
          {currentMessages.map((msg, idx) => {
            const isStreamingMsg = msg.isStreaming === true;
            const displayText = isStreamingMsg ? streamingMessage : msg.text;
            
            if (!displayText && !isStreamingMsg) return null;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className={`flex flex-col gap-2 max-w-[85%] shrink-0 ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
              >
                <div 
                  className={`px-6 py-4 bg-[var(--color-white)] text-[var(--color-black)] text-[12px] shadow-sm ${msg.role === 'user' ? 'rounded-br-xl' : 'rounded-bl-xl'} selectable-text`}
                  style={{ 
                    borderRadius: 'var(--radius-main)', 
                    borderBottomRightRadius: msg.role === 'user' ? '12px' : 'var(--radius-main)',
                    borderBottomLeftRadius: msg.role === 'ai' ? '12px' : 'var(--radius-main)',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden'
                  }}
                >
                  {msg.role === 'user' && msg.contextFiles && msg.contextFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-black/5">
                      {msg.contextFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black/5 px-3 py-1.5" style={{ borderRadius: '12px' }}>
                          <img src={iconFile} alt="File" className="w-3.5 h-3.5 opacity-70" />
                          <span className="text-[11px] font-bold text-[var(--color-black)] opacity-80">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed break-words text-[12px]">{displayText}</p>
                  ) : (
                    <>
                      <div className="break-words overflow-hidden w-full text-[12px]">
                        {isStreamingMsg ? (
                          <div className="leading-relaxed break-words">
                            {displayText}
                            <span className="inline-block w-1 h-3 bg-[var(--color-black)] animate-pulse ml-0.5"></span>
                          </div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: CodeBlock,
                              p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed break-words text-[12px]" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5 break-words text-[12px]" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 break-words text-[12px]" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-bold text-[12px] break-words" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-black/20 pl-3 my-3 break-words text-[12px]" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-[16px] font-bold my-3 break-words" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-[14px] font-bold my-2 break-words" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-[13px] font-bold my-2 break-words" {...props} />,
                            }}
                          >
                            {displayText}
                          </ReactMarkdown>
                        )}
                      </div>

                      {!isStreamingMsg && msg.tableData && msg.tableData.length > 0 && (
                        <TableRenderer 
                          data={msg.tableData} 
                          onExport={() => handleExportTable(msg.tableData, `table_${Date.now()}`)}
                        />
                      )}

                      {!isStreamingMsg && msg.files && msg.files.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-black/5">
                          <span className="text-[10px] font-bold text-[var(--color-black)] opacity-50 uppercase tracking-widest">
                            Generated Files ({msg.files.length})
                          </span>
                          {msg.files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-black/5 border border-black/5 hover:bg-black/10 transition-colors mt-2" style={{ borderRadius: '16px' }}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-[var(--color-white)] shadow-sm flex items-center justify-center shrink-0" style={{ borderRadius: '12px' }}>
                                  <img src={iconFile} alt="File" className="w-5 h-5 opacity-80" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-[11px] font-bold text-[var(--color-black)] leading-none mb-1 truncate">{file.name}</span>
                                  <span className="text-[10px] text-[var(--color-black)]/50 font-bold uppercase tracking-wider">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleSaveGeneratedFile(file)}
                                className="px-4 py-2 bg-[var(--color-black)] hover:opacity-80 text-[var(--color-white)] text-[11px] font-bold transition-opacity shrink-0"
                                style={{ borderRadius: '12px' }}
                              >
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isStreamingMsg && msg.webResults && msg.webResults.length > 0 && (
                        <WebSearchResults results={msg.webResults} />
                      )}

                      {!isStreamingMsg && msg.responseTime && (
                        <div className="mt-2 text-[10px] text-[var(--color-black)]/40">
                          Ответ за {msg.responseTime} сек
                        </div>
                      )}

                      {!isStreamingMsg && displayText && (
                        <button 
                          onClick={() => handleCopyResponse(displayText)}
                          className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-black)]/50 hover:text-[var(--color-black)] transition-colors"
                        >
                          <img src={iconCopy} alt="Copy" className="w-4 h-4" />
                          Copy response
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {isLoading && !isStreaming && (
            <div className="self-start px-6 py-4 bg-[var(--color-white)] text-[var(--color-black)] text-[12px] shadow-sm shrink-0" style={{ borderRadius: 'var(--radius-main)', borderBottomLeftRadius: '12px' }}>
              <div className="flex items-center gap-4">
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span className="text-[11px] text-[var(--color-black)]/60">Koda печатает...</span>
                {isGenerating && (
                  <button 
                    onClick={handleAbort}
                    className="text-[11px] text-red-500 hover:text-red-700 font-bold ml-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="h-4 shrink-0" />
        </div>

        {/* 🔥 ЦЕНТРИРОВАННЫЙ ИНПУТ (ПОКА НЕТ СООБЩЕНИЙ) */}
        <div className={`flex-1 flex items-center justify-center ${hasSentFirstMessage ? 'hidden' : ''}`}>
          <div className="w-full max-w-[40%] flex flex-col items-center gap-4">
            {/* Файлы над инпутом (если есть) */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[var(--color-input)] px-4 py-2 text-[var(--color-black)] shadow-sm rounded-full">
                    <img src={iconFile} alt="File" className="w-4 h-4 opacity-80" />
                    <span className="text-[11px] font-bold truncate max-w-[100px]">{file.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter(f => f.path !== file.path))} className="hover:opacity-50 text-lg font-bold leading-none">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Инпут в центре */}
            <div className="w-full bg-[var(--color-input)] flex items-center p-2 shadow-lg overflow-hidden" style={{ borderRadius: 'var(--radius-main)' }}>
              <div className="relative shrink-0" ref={attachMenuRef}>
                <button onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)} className="w-[50px] h-[50px] flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity">
                  <img src={iconPlus} alt="Add" className="w-6 h-6" />
                </button>
                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-[115%] left-0 w-56 p-2 bg-[var(--color-white)] shadow-xl origin-bottom-left z-50"
                      style={{ borderRadius: '20px', border: '1px solid var(--color-input)' }}
                    >
                      <button onClick={handleAddFiles} className="flex items-center gap-3 w-full p-3 text-[12px] text-[var(--color-black)] hover:bg-black/5 rounded-xl transition-colors font-medium">
                        <img src={iconFile} alt="Files" className="w-4 h-4" /> Files
                      </button>
                      <button onClick={handleAddToKnowledge} className="flex items-center gap-3 w-full p-3 text-[12px] text-[var(--color-black)] hover:bg-black/5 rounded-xl transition-colors font-medium">
                        <img src={iconLibrary} alt="Knowledge" className="w-4 h-4" /> Add to Knowledge
                      </button>
                      <div className="h-[1px] bg-black/5 my-1" />
                      <button 
                        onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                        className={`flex items-center gap-3 w-full p-3 text-[12px] rounded-xl transition-colors font-medium ${isWebSearchEnabled ? 'bg-black/10 text-black' : 'text-black/60 hover:bg-black/5'}`}
                      >
                        <img 
                          src={iconWebSearch} 
                          alt="Web Search" 
                          className="w-4 h-4"
                          style={{
                            filter: isWebSearchEnabled ? 'none' : 'brightness(0) saturate(0) opacity(0.4)'
                          }}
                        />
                        Web Search {isWebSearchEnabled && '✓'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isListening}
                placeholder={isListening ? 'Listening...' : 'Ask Koda anything...'}
                className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--color-black)] placeholder:text-[var(--color-black)]/60 px-2 min-w-0 resize-none overflow-y-auto"
                style={{ 
                  maxHeight: '180px',
                  minHeight: '50px',
                  lineHeight: '1.5',
                  paddingTop: '14px',
                  paddingBottom: '14px'
                }}
                rows={1}
              />
              
              <button 
                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                className={`w-[45px] h-[45px] flex items-center justify-center shrink-0 transition-colors rounded-full ${isWebSearchEnabled ? 'bg-black/10' : ''}`}
              >
                <img 
                  src={iconWebSearch} 
                  alt="Web Search"
                  className="w-5 h-5"
                  style={{
                    filter: isWebSearchEnabled ? 'none' : 'brightness(0) saturate(0) opacity(0.4)'
                  }}
                />
              </button>
              
              <button onClick={handleMicClick} className={`w-[50px] h-[50px] flex items-center justify-center shrink-0 transition-opacity ${isListening ? 'animate-pulse opacity-50' : 'hover:opacity-70'}`}>
                <img src={iconMic} alt="Mic" className="w-6 h-6" />
              </button>

              <button onClick={handleSend} disabled={(!input.trim() && selectedFiles.length === 0) || isLoading} className="w-[50px] h-[50px] flex items-center justify-center shrink-0 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                <img src={input.trim() || selectedFiles.length > 0 ? iconSendFill : iconSendOutline} alt="Send" className="w-[50px] h-[50px]" />
              </button>
            </div>
            
            <span className="text-[10px] text-[var(--color-white)] opacity-40 font-medium text-center">
              Koda is an AI. It can make mistakes.
            </span>
          </div>
        </div>

        {/* 🔥 ИНПУТ СНИЗУ (после первого сообщения) */}
        {hasSentFirstMessage && (
          <div className="w-full flex flex-col items-center gap-3 shrink-0 px-6">
            <div className="w-full bg-[var(--color-input)] flex items-center p-2 shadow-lg overflow-hidden" style={{ borderRadius: 'var(--radius-main)' }}>
              
              <div className="relative shrink-0" ref={attachMenuRef}>
                <button onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)} className="w-[50px] h-[50px] flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity">
                  <img src={iconPlus} alt="Add" className="w-6 h-6" />
                </button>
                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-[115%] left-0 w-56 p-2 bg-[var(--color-white)] shadow-xl origin-bottom-left z-50"
                      style={{ borderRadius: '20px', border: '1px solid var(--color-input)' }}
                    >
                      <button onClick={handleAddFiles} className="flex items-center gap-3 w-full p-3 text-[12px] text-[var(--color-black)] hover:bg-black/5 rounded-xl transition-colors font-medium">
                        <img src={iconFile} alt="Files" className="w-4 h-4" /> Files
                      </button>
                      <button onClick={handleAddToKnowledge} className="flex items-center gap-3 w-full p-3 text-[12px] text-[var(--color-black)] hover:bg-black/5 rounded-xl transition-colors font-medium">
                        <img src={iconLibrary} alt="Knowledge" className="w-4 h-4" /> Add to Knowledge
                      </button>
                      <div className="h-[1px] bg-black/5 my-1" />
                      <button 
                        onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                        className={`flex items-center gap-3 w-full p-3 text-[12px] rounded-xl transition-colors font-medium ${isWebSearchEnabled ? 'bg-black/10 text-black' : 'text-black/60 hover:bg-black/5'}`}
                      >
                        <img 
                          src={iconWebSearch} 
                          alt="Web Search" 
                          className="w-4 h-4"
                          style={{
                            filter: isWebSearchEnabled ? 'none' : 'brightness(0) saturate(0) opacity(0.4)'
                          }}
                        />
                        Web Search {isWebSearchEnabled && '✓'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isListening}
                placeholder={isListening ? 'Listening...' : 'Ask Koda anything...'}
                className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--color-black)] placeholder:text-[var(--color-black)]/60 px-2 min-w-0 resize-none overflow-y-auto"
                style={{ 
                  maxHeight: '180px',
                  minHeight: '50px',
                  lineHeight: '1.5',
                  paddingTop: '14px',
                  paddingBottom: '14px'
                }}
                rows={1}
              />
              
              <button 
                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                className={`w-[45px] h-[45px] flex items-center justify-center shrink-0 transition-colors rounded-full ${isWebSearchEnabled ? 'bg-black/10' : ''}`}
              >
                <img 
                  src={iconWebSearch} 
                  alt="Web Search"
                  className="w-5 h-5"
                  style={{
                    filter: isWebSearchEnabled ? 'none' : 'brightness(0) saturate(0) opacity(0.4)'
                  }}
                />
              </button>
              
              <button onClick={handleMicClick} className={`w-[50px] h-[50px] flex items-center justify-center shrink-0 transition-opacity ${isListening ? 'animate-pulse opacity-50' : 'hover:opacity-70'}`}>
                <img src={iconMic} alt="Mic" className="w-6 h-6" />
              </button>

              <button onClick={handleSend} disabled={(!input.trim() && selectedFiles.length === 0) || isLoading} className="w-[50px] h-[50px] flex items-center justify-center shrink-0 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                <img src={input.trim() || selectedFiles.length > 0 ? iconSendFill : iconSendOutline} alt="Send" className="w-[50px] h-[50px]" />
              </button>

            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-[var(--color-white)] opacity-40 font-medium text-center">
                Koda is an AI. It can make mistakes.
              </span>
              <span className="text-[10px] text-[var(--color-white)]/20 font-mono">
                Ctrl+K — поиск • Esc — отмена
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}