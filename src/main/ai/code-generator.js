import path from 'path'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as xlsx from 'xlsx'
import AdmZip from 'adm-zip'

// ============================================================
// ГЕНЕРАЦИЯ СОДЕРЖИМОГО ФАЙЛА
// ============================================================

export function generateFileContent(fileName, content, format = 'text') {
  try {
    switch (format.toLowerCase()) {
      // 🔥 EXCEL
      case 'excel':
      case 'xlsx': {
        const lines = content.split('\n').filter(line => line.trim());
        const data = lines.map(line => line.split(/[\t,|;]/).map(cell => cell.trim()));
        if (data.length === 0) data.push(['Нет данных']);
        
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Данные');
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      }

      // 🔥 WORD
      case 'word':
      case 'docx': {
        const paragraphs = content.split('\n').filter(line => line.trim()).map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 200 }
          })
        );
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs.length > 0 ? paragraphs : [
              new Paragraph({
                children: [new TextRun({ text: content || 'Пустой документ' })]
              })
            ]
          }]
        });
        return Packer.toBuffer(doc);
      }

      // 🔥 PDF
      case 'pdf': {
        return generatePDF(content);
      }

      // 🔥 ZIP
      case 'zip': {
        const zip = new AdmZip();
        const files = parseFilesFromContent(content);
        
        if (files.length === 0) {
          zip.addFile('content.txt', Buffer.from(content || 'Пустое содержимое', 'utf-8'));
        } else {
          files.forEach(f => {
            if (f.name && f.content) {
              zip.addFile(f.name, Buffer.from(f.content, 'utf-8'));
            }
          });
        }
        return zip.toBuffer();
      }

      // 🔥 ТЕКСТ (по умолчанию)
      default:
        return Buffer.from(content || 'Пустое содержимое', 'utf-8');
    }
  } catch (error) {
    console.error('[CODE] ошибка генерации файла:', error);
    return Buffer.from(content || 'Ошибка генерации файла', 'utf-8');
  }
}

// ============================================================
// ГЕНЕРАЦИЯ PDF
// ============================================================

async function generatePDF(content) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lines = (content || 'Пустой документ').split('\n');
  let y = 750;
  
  for (const line of lines) {
    if (y < 50) {
      const newPage = pdfDoc.addPage([600, 800]);
      y = 750;
    }
    
    page.drawText(line.substring(0, 80), {
      x: 50,
      y: y,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });
    y -= 20;
  }
  
  return await pdfDoc.save();
}

// ============================================================
// ПАРСИНГ ФАЙЛОВ ИЗ КОНТЕНТА
// ============================================================

function parseFilesFromContent(content) {
  const files = [];
  const fileRegex = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let match;
  let hasFiles = false;

  while ((match = fileRegex.exec(content)) !== null) {
    hasFiles = true;
    const fileName = match[1].trim();
    const fileContent = match[2].trim();
    if (fileName && fileContent) {
      files.push({
        name: fileName,
        content: fileContent
      });
    }
  }

  // 🔥 ЕСЛИ НЕТ ФАЙЛОВ В ФОРМАТЕ [FILE:...] — ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ
  if (!hasFiles) {
    return files;
  }

  return files;
}

// ============================================================
// ПАРСИНГ ОТВЕТА AI
// ============================================================

export function parseAIResponse(response) {
  const files = [];
  let cleanText = response;
  let tableData = null;

  // 🔥 1. ИЩЕМ ТАБЛИЦЫ В ФОРМАТЕ MARKDOWN
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(response)) !== null) {
    const headers = tableMatch[1].split('|').map(h => h.trim()).filter(h => h);
    const rows = tableMatch[2].split('\n').filter(line => line.trim()).map(line =>
      line.split('|').slice(1, -1).map(cell => cell.trim())
    );

    if (headers.length > 0 && rows.length > 0) {
      tableData = rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || '';
        });
        return obj;
      });
      cleanText = cleanText.replace(tableMatch[0], '📊 Таблица данных:\n');
    }
  }

  // 🔥 2. ИЩЕМ ФАЙЛЫ В ФОРМАТЕ [FILE:...] ... [/FILE]
  const fileRegex = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let match;

  while ((match = fileRegex.exec(response)) !== null) {
    const fileName = match[1].trim();
    let content = match[2].trim();

    const ext = path.extname(fileName).toLowerCase();
    let fileType = 'text';
    if (['.xlsx', '.xls'].includes(ext)) fileType = 'excel';
    else if (['.docx', '.doc'].includes(ext)) fileType = 'word';
    else if (['.pdf'].includes(ext)) fileType = 'pdf';
    else if (['.zip'].includes(ext)) fileType = 'zip';

    try {
      const buffer = generateFileContent(fileName, content, fileType);
      const base64Content = buffer.toString('base64');

      files.push({
        name: fileName,
        content: base64Content,
        type: fileType,
        size: buffer.length
      });
      
      console.log(`[CODE] файл создан: ${fileName} (${buffer.length} байт)`);
    } catch (error) {
      console.error(`[CODE] ошибка генерации ${fileName}:`, error);
      const buffer = Buffer.from(content || 'Пустой файл', 'utf-8');
      files.push({
        name: fileName,
        content: buffer.toString('base64'),
        type: 'text',
        size: buffer.length
      });
    }

    cleanText = cleanText.replace(match[0], '');
  }

  // 🔥 3. УДАЛЯЕМ ОСТАТКИ МАРКЕРОВ
  cleanText = cleanText.replace(/\[FILE:/g, '');
  cleanText = cleanText.replace(/\[\/FILE\]/g, '');
  cleanText = cleanText.replace(/\s{3,}/g, ' ').trim();

  // 🔥 4. ЕСЛИ ЕСТЬ ФАЙЛЫ, НО ТЕКСТ ПУСТОЙ — ДОБАВЛЯЕМ СООБЩЕНИЕ
  if (!cleanText && files.length > 0) {
    cleanText = 'Файлы созданы: ' + files.map(f => f.name).join(', ');
  }

  // 🔥 5. ЕСЛИ НЕТ ФАЙЛОВ И ТЕКСТ ПУСТОЙ — ВОЗВРАЩАЕМ ОРИГИНАЛ
  if (!cleanText && files.length === 0) {
    cleanText = response;
  }

  return { files, cleanText, tableData };
}