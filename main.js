const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const screenshot = require("screenshot-desktop");

let mainWindow;
let stopRequested = false; // Флаг остановки процесса

// Создание окна Electron
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
}

// Ожидание готовности приложения
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Закрытие приложения, когда все окна закрыты
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Функция для чтения ID из файла
function readIdsFromFile(filePath) {
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// Функция задержки
async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// Логика для создания скриншотов
async function takeScreenshotWithBrowserUI(itemId, outputDir) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  const url = `https://www.wildberries.ru/catalog/${itemId}/detail.aspx`;

  try {
    // Получаем все вкладки (страницы) в браузере
    const pages = await browser.pages();

    // Закрываем вкладку about:blank, которая открывается по умолчанию
    if (pages.length > 0) {
      await pages[0].close();
    }

    // Переход на страницу товара
    await page.goto(url, { waitUntil: "networkidle2" });

    // Ожидание загрузки
    await delay(4000);

    // Делаем скриншот
    const screenshotPath = path.join(outputDir, `${itemId}.png`);
    await screenshot({ format: "png", filename: screenshotPath });
  } catch (error) {
    console.error(`Ошибка при создании скриншота для товара ${itemId}:`, error);
  } finally {
    await browser.close();
  }
}

// Обработка выбора файла
ipcMain.handle("select-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });

  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// Функция для создания папки results
function createResultsFolder(filePath) {
  const outputDir = path.join(path.dirname(filePath), "results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// Обработка создания скриншотов
ipcMain.handle("start-screenshots", async (event, filePath) => {
  stopRequested = false; // Сбрасываем флаг остановки

  const outputDir = createResultsFolder(filePath); // Папка results в директории файла
  const itemIds = readIdsFromFile(filePath); // Чтение ID товаров из файла

  if (itemIds.length === 0) {
    event.sender.send(
      "progress-update",
      "Файл пуст или содержит неверные данные."
    );
    return;
  }

  for (const [index, itemId] of itemIds.entries()) {
    if (stopRequested) {
      event.sender.send("progress-update", "Процесс остановлен пользователем.");
      return;
    }

    await takeScreenshotWithBrowserUI(itemId, outputDir);
    event.sender.send(
      "progress-update",
      `Сохранен файл ${index + 1} из ${itemIds.length}`
    );
  }

  event.sender.send("progress-update", "Создание скриншотов завершено!");
});

// Обработка остановки процесса
ipcMain.handle("stop-screenshots", async () => {
  stopRequested = true; // Устанавливаем флаг остановки
});
