import * as xlsx from 'xlsx'
import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ — ЭКСПОРТ В EXCEL
// ============================================================

export async function exportTableToExcel(data, fileName = 'table_data') {
  try {
    // 🔥 1. ПРОВЕРЯЕМ ДАННЫЕ
    if (!data || data.length === 0) {
      console.error('[EXCEL] нет данных для экспорта');
      return { success: false, error: 'Нет данных для экспорта' };
    }

    console.log(`[EXCEL] экспорт ${data.length} строк`);

    // 🔥 2. ОТКРЫВАЕМ ДИАЛОГ СОХРАНЕНИЯ
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${fileName}.xlsx`,
      title: 'Сохранить таблицу',
      filters: [
        { name: 'Excel', extensions: ['xlsx'] }
      ]
    });

    if (canceled || !filePath) {
      console.log('[EXCEL] экспорт отменён');
      return { success: false, cancelled: true };
    }

    // 🔥 3. СОЗДАЁМ КНИГУ EXCEL
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // 🔥 4. НАСТРАИВАЕМ ШИРИНУ КОЛОНОК
    const colWidths = [];
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      headers.forEach((header, idx) => {
        let maxLen = header.length;
        data.forEach(row => {
          const val = String(row[header] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        colWidths[idx] = { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
      });
      ws['!cols'] = colWidths;
    }

    // 🔥 5. ДОБАВЛЯЕМ ЛИСТ
    xlsx.utils.book_append_sheet(wb, ws, 'Данные');

    // 🔥 6. СОХРАНЯЕМ ФАЙЛ
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);

    console.log(`[EXCEL] сохранён: ${filePath} (${buffer.length} байт)`);
    return { success: true, path: filePath };

  } catch (error) {
    console.error('[EXCEL] ошибка экспорта:', error);
    return { success: false, error: error.message || 'Ошибка экспорта' };
  }
}

// ============================================================
// ЭКСПОРТ С ПРОГРЕССОМ
// ============================================================

export async function exportTableToExcelWithProgress(data, fileName, onProgress) {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'Нет данных' };
    }

    // 🔥 СОЗДАЁМ КНИГУ
    const wb = xlsx.utils.book_new();
    
    // 🔥 ПОШАГОВО ДОБАВЛЯЕМ СТРОКИ (ДЛЯ БОЛЬШИХ ДАННЫХ)
    const batchSize = 1000;
    const totalRows = data.length;
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const ws = xlsx.utils.json_to_sheet(batch);
      
      // 🔥 ОБЪЕДИНЯЕМ ЛИСТЫ
      if (i === 0) {
        xlsx.utils.book_append_sheet(wb, ws, 'Данные');
      } else {
        const existingWs = wb.Sheets['Данные'];
        const range = xlsx.utils.decode_range(existingWs['!ref']);
        const startRow = range.e.r + 1;
        
        // 🔥 ДОБАВЛЯЕМ СТРОКИ В СУЩЕСТВУЮЩИЙ ЛИСТ
        const jsonData = xlsx.utils.sheet_to_json(ws, { header: 1 });
        jsonData.forEach((row, rowIdx) => {
          const r = startRow + rowIdx;
          row.forEach((cell, colIdx) => {
            const cellRef = xlsx.utils.encode_cell({ r, c: colIdx });
            existingWs[cellRef] = { v: cell };
          });
        });
        
        // 🔥 ОБНОВЛЯЕМ ДИАПАЗОН
        const newRange = xlsx.utils.decode_range(existingWs['!ref']);
        newRange.e.r = startRow + jsonData.length - 1;
        existingWs['!ref'] = xlsx.utils.encode_range(newRange);
      }
      
      // 🔥 ПРОГРЕСС
      if (onProgress) {
        onProgress(Math.round((i + batch.length) / totalRows * 100));
      }
    }

    // 🔥 ОТКРЫВАЕМ ДИАЛОГ
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${fileName}.xlsx`,
      title: 'Сохранить таблицу',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    // 🔥 СОХРАНЯЕМ
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);

    return { success: true, path: filePath };

  } catch (error) {
    console.error('[EXCEL] ошибка:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// ЭКСПОРТ МНОГИХ ТАБЛИЦ В ОДИН ФАЙЛ (НЕСКОЛЬКО ЛИСТОВ)
// ============================================================

export async function exportMultipleSheets(sheets, fileName = 'report') {
  try {
    if (!sheets || sheets.length === 0) {
      return { success: false, error: 'Нет данных' };
    }

    const wb = xlsx.utils.book_new();

    // 🔥 ДОБАВЛЯЕМ КАЖДЫЙ ЛИСТ
    sheets.forEach((sheet, index) => {
      const ws = xlsx.utils.json_to_sheet(sheet.data);
      const sheetName = sheet.name || `Лист${index + 1}`;
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
    });

    // 🔥 ДИАЛОГ СОХРАНЕНИЯ
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${fileName}.xlsx`,
      title: 'Сохранить отчёт',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);

    return { success: true, path: filePath };

  } catch (error) {
    console.error('[EXCEL] ошибка:', error);
    return { success: false, error: error.message };
  }
}