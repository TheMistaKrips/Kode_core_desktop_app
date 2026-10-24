// ============================================================
// Prismi — общие контракты данных (единый источник правды)
// Используется в main, renderer и (в будущем) на сервере.
// ============================================================

/** Прикреплённый к сообщению файл */
export interface FileAttachment {
  path: string;
  name: string;
  type?: string;
  size?: number;
}

/** Строка таблицы (ключ — заголовок колонки) */
export interface TableRow {
  [key: string]: string | number;
}

/** Сгенерированный файл (содержимое уже в base64) */
export interface GeneratedFile {
  name: string;
  content: string; // base64
  type: string; // text | excel | word | pdf | zip
  size: number;
}

/** Результат веб-поиска */
export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

/** Сообщение чата */
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  files?: GeneratedFile[] | FileAttachment[];
  contextFiles?: FileAttachment[];
  tableData?: TableRow[] | null;
  webResults?: WebSearchResult[];
  responseTime?: string;
  isStreaming?: boolean;
  timestamp?: string;
}

/** Ответ генератора (main-процесс) */
export interface GenerateResponse {
  text: string;
  files: GeneratedFile[];
  tableData: TableRow[] | null;
  webResults: WebSearchResult[];
  modelUsed?: string;
  cancelled?: boolean;
}

/** Конфигурация агента */
export interface AgentConfig {
  id?: string;
  name?: string;
  type?: 'orchestrator' | 'researcher' | 'coder' | 'analyst' | 'writer' | string;
  description?: string;
}

/** Подзадача оркестратора */
export interface SubTask {
  id: string;
  description: string;
  agentType: 'researcher' | 'coder' | 'analyst' | 'writer' | string;
  priority?: number;
  dependsOn?: string[];
}
