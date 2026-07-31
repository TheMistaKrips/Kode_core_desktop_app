// ============================================================
// OCR — РАСПОЗНАВАНИЕ ТЕКСТА НА ИЗОБРАЖЕНИЯХ
// ============================================================

let Tesseract = null;
let isTesseractLoading = false;

// ============================================================
// ЛЕНИВАЯ ЗАГРУЗКА TESSERACT
// ============================================================

async function getTesseract() {
  // 🔥 ЕСЛИ УЖЕ ЗАГРУЖЕН — ВОЗВРАЩАЕМ
  if (Tesseract) {
    return Tesseract;
  }

  // 🔥 ЗАЩИТА ОТ ПАРАЛЛЕЛЬНОЙ ЗАГРУЗКИ
  if (isTesseractLoading) {
    while (isTesseractLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return Tesseract;
  }

  isTesseractLoading = true;
  
  try {
    console.log('[OCR] загрузка Tesseract...');
    const module = await import('tesseract.js');
    Tesseract = module.default || module;
    console.log('[OCR] Tesseract загружен');
    return Tesseract;
  } catch (error) {
    console.error('[OCR] ошибка загрузки Tesseract:', error);
    throw error;
  } finally {
    isTesseractLoading = false;
  }
}

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ — РАСПОЗНАВАНИЕ
// ============================================================

export async function performOCR(imagePath) {
  try {
    // 🔥 1. ПРОВЕРЯЕМ, СУЩЕСТВУЕТ ЛИ ФАЙЛ
    const fs = await import('fs');
    if (!fs.existsSync(imagePath)) {
      console.error(`[OCR] файл не найден: ${imagePath}`);
      return '[Ошибка] Файл не найден';
    }

    console.log(`[OCR] распознавание: ${imagePath}`);

    // 🔥 2. ЗАГРУЖАЕМ TESSERACT
    const tesseract = await getTesseract();

    // 🔥 3. ВЫПОЛНЯЕМ РАСПОЗНАВАНИЕ
    const result = await tesseract.recognize(imagePath, 'rus+eng', {
      // 🔥 ОПЦИИ ДЛЯ ЛУЧШЕГО РАСПОЗНАВАНИЯ
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Можно добавить прогресс, если нужно
        }
      }
    });

    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    console.log(`[OCR] распознано ${text.length} символов (уверенность: ${Math.round(confidence)}%)`);

    // 🔥 4. ЕСЛИ ТЕКСТА МАЛО — ВОЗВРАЩАЕМ СООБЩЕНИЕ
    if (text.trim().length < 3) {
      return '[OCR] Текст на изображении не обнаружен';
    }

    return text.trim();

  } catch (error) {
    console.error('[OCR] ошибка:', error);
    
    // 🔥 5. ОБРАБОТКА ОШИБОК
    if (error.message?.includes('timeout')) {
      return '[OCR] Превышено время распознавания';
    }
    
    if (error.message?.includes('memory')) {
      return '[OCR] Недостаточно памяти для распознавания';
    }
    
    return `[Ошибка OCR] ${error.message || 'Неизвестная ошибка'}`;
  }
}

// ============================================================
// РАСПОЗНАВАНИЕ С УКАЗАНИЕМ ЯЗЫКА
// ============================================================

export async function performOCRWithLanguage(imagePath, language = 'rus+eng') {
  try {
    const tesseract = await getTesseract();
    const result = await tesseract.recognize(imagePath, language);
    return result.data.text || '';
  } catch (error) {
    console.error('[OCR] ошибка:', error);
    return '';
  }
}

// ============================================================
// ПРОВЕРКА, ПОДДЕРЖИВАЕТСЯ ЛИ OCR
// ============================================================

export async function isOCRSupported() {
  try {
    await getTesseract();
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================
// ЭКСПОРТ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ============================================================

export default {
  performOCR,
  performOCRWithLanguage,
  isOCRSupported
};