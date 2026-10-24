import path from 'path'
import fs from 'fs'
import pdfParse from 'pdf-parse'
import * as xlsx from 'xlsx'
import mammoth from 'mammoth'
import AdmZip from 'adm-zip'
import { performOCR } from './ocr.js'

// ============================================================
// КЭШ ФАЙЛОВ
// ============================================================

const fileCache = new Map();
const MAX_CACHE_SIZE = 50; // 🔥 МАКСИМУМ 50 ФАЙЛОВ В КЭШЕ

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ — ПАРСИНГ ФАЙЛА
// ============================================================

export async function parseFileContent(filePath) {
  // 🔥 ПРОВЕРЯЕМ КЭШ
  if (fileCache.has(filePath)) {
    console.log(`[FILES] кэш: ${path.basename(filePath)}`);
    return fileCache.get(filePath);
  }

  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  try {
    // 🔥 ПРОВЕРЯЕМ, СУЩЕСТВУЕТ ЛИ ФАЙЛ
    if (!fs.existsSync(filePath)) {
      return `[Ошибка] Файл не найден: ${filePath}`;
    }

    console.log(`[FILES] чтение: ${path.basename(filePath)} (${ext})`);

    // 🔥 ИЗОБРАЖЕНИЯ → OCR
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.ico'];
    if (imageExts.includes(ext)) {
      text = await performOCR(filePath) || '[Изображение не содержит текста]';
    }

    // 🔥 PDF
    else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text || '[PDF не содержит текста]';
    }

    // 🔥 DOCX
    else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '[DOCX не содержит текста]';
    }

    // 🔥 XLSX / XLS / CSV
    else if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      const workbook = xlsx.readFile(filePath);
      let allText = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        
        if (jsonData.length > 0) {
          allText += `--- Лист: ${sheetName} ---\n`;
          jsonData.forEach(row => {
            allText += Object.values(row).join(' | ') + '\n';
          });
          allText += '\n';
        }
      });
      
      text = allText || '[Файл Excel не содержит данных]';
    }

    // 🔥 ZIP-АРХИВ
    else if (ext === '.zip') {
      try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        const textExts = ['.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.html', '.css', '.xml', '.md', '.yml', '.yaml', '.csv', '.sql', '.log', '.sh', '.c', '.cpp', '.h', '.java', '.go', '.rs', '.rb', '.php', '.vue', '.svelte', '.ini', '.cfg', '.conf', '.toml'];
        let archiveText = `--- Архив: ${path.basename(filePath)} (${entries.length} файлов) ---\n`;
        let textCount = 0;
        const maxEntries = 20;

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          if (textCount >= maxEntries) break;
          const name = entry.entryName;
          const eext = path.extname(name).toLowerCase();
          if (textExts.includes(eext) || eext === '') {
            try {
              const entryText = entry.getData().toString('utf-8');
              archiveText += `\n--- ${name} ---\n${entryText}\n`;
              textCount++;
            } catch {
              archiveText += `\n--- ${name} ---\n[бинарный файл]\n`;
              textCount++;
            }
          }
        }

        if (textCount === 0) {
          archiveText += '\n[Архив содержит только бинарные файлы или файлы без текста]\n';
        }
        text = archiveText;
      } catch (err) {
        text = `[Ошибка чтения архива: ${err.message}]`;
      }
    }

    // 🔥 ТЕКСТОВЫЕ ФАЙЛЫ И КОД
    else if (['.txt', '.js', '.py', '.json', '.html', '.css', '.xml', '.md', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.c', '.cpp', '.h', '.hpp', '.java', '.go', '.rs', '.rb', '.php', '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.sql', '.log'].includes(ext)) {
      text = fs.readFileSync(filePath, 'utf-8');
    }

    // 🔥 НЕИЗВЕСТНЫЙ ФОРМАТ
    else {
      text = `[Файл ${path.basename(filePath)} не поддерживается для чтения]`;
    }

    // 🔥 ОБРЕЗАЕМ ДЛИННЫЙ ТЕКСТ (МАКСИМУМ 16000 СИМВОЛОВ)
    if (text.length > 16000) {
      text = text.substring(0, 16000) + '\n...[Текст обрезан]';
    }

    // 🔥 СОХРАНЯЕМ В КЭШ
    if (fileCache.size >= MAX_CACHE_SIZE) {
      const firstKey = fileCache.keys().next().value;
      fileCache.delete(firstKey);
    }
    fileCache.set(filePath, text);

    console.log(`[FILES] прочитано: ${path.basename(filePath)} (${text.length} символов)`);
    return text;

  } catch (error) {
    console.error(`[FILES] ошибка чтения ${filePath}:`, error);
    return `[Ошибка чтения: ${error.message}]`;
  }
}

// ============================================================
// ОЧИСТКА КЭША
// ============================================================

export function clearFileCache() {
  const size = fileCache.size;
  fileCache.clear();
  console.log(`[FILES] кэш очищен (${size} файлов)`);
  return size;
}

// ============================================================
// ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ФАЙЛЕ
// ============================================================

export function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    
    return {
      name: name,
      path: filePath,
      ext: ext,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      modified: stats.mtime,
      isCached: fileCache.has(filePath)
    };
  } catch (error) {
    return null;
  }
}

// ============================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ — ФОРМАТИРОВАНИЕ РАЗМЕРА
// ============================================================

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================
// ЭКСПОРТ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export default {
  parseFileContent,
  clearFileCache,
  getFileInfo
};