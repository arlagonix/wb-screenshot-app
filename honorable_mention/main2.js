const puppeteer = require("puppeteer");
const screenshot = require("screenshot-desktop");
const fs = require("fs");
const path = require("path");

// Путь к папке с результатами
const resultsDir = path.join(__dirname, "/results/");

// Функция для очистки папки с результатами
function clearResultsFolder() {
  if (fs.existsSync(resultsDir)) {
    fs.readdirSync(resultsDir).forEach((file) => {
      const filePath = path.join(resultsDir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath); // Удаляем файлы
      }
    });
    console.log("Папка results очищена.");
  } else {
    fs.mkdirSync(resultsDir); // Создаем папку, если она не существует
    console.log("Папка results создана.");
  }
}

// Функция для чтения ID из текстового файла
function readIdsFromFile(filePath) {
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0); // Убираем пустые строки
}

// Функция задержки
async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// Функция для создания скриншота по ID товара с браузерным интерфейсом
async function takeScreenshotWithBrowserUI(itemId) {
  const browser = await puppeteer.launch({
    headless: false, // Запускаем браузер с интерфейсом
    defaultViewport: null,
    args: ["--start-maximized"], // Запускаем браузер в максимальном размере окна
  });

  const page = await browser.newPage();
  const url = `https://www.wildberries.ru/catalog/${itemId}/detail.aspx`;

  try {
    // Переход на страницу товара
    await page.goto(url, { waitUntil: "networkidle2" });

    // Ожидание для полной загрузки страницы
    await delay(2000);

    // Делаем скриншот всего экрана (включая браузерный интерфейс)
    const screenshotPath = path.join(resultsDir, `${itemId}.png`);
    await screenshot({ format: "png", filename: screenshotPath });
    console.log(`Скриншот для товара ${itemId} сохранен в файл ${itemId}.png`);
  } catch (error) {
    console.error(`Ошибка при создании скриншота для товара ${itemId}:`, error);
  } finally {
    await browser.close();
  }
}

// Основная функция для захвата скриншотов всех товаров
async function takeScreenshots(filePath) {
  // Очищаем папку с результатами перед запуском
  clearResultsFolder();

  const itemIds = readIdsFromFile(filePath); // Чтение ID из файла

  if (itemIds.length === 0) {
    console.log("Файл пуст или содержит неверные данные.");
    return;
  }

  for (const itemId of itemIds) {
    await takeScreenshotWithBrowserUI(itemId);
  }
}

// Запуск программы, передаем путь к файлу с ID
const filePath = "./ids.txt"; // Укажите путь к вашему текстовому файлу с ID
takeScreenshots(filePath);
