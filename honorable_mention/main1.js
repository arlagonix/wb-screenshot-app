const puppeteer = require("puppeteer");
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

// Функция для получения текущей даты и времени в формате строки
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString(); // Возвращает строку с текущими датой и временем
}

// Функция для добавления ссылки и текущей даты/времени на страницу
async function addLinkAndTimestampToPage(page, url) {
  const dateTimeString = getCurrentDateTime();
  await page.evaluate(
    (url, dateTimeString) => {
      // Создаем элемент <div> для отображения ссылки
      const linkDiv = document.createElement("div");
      linkDiv.style.position = "fixed";
      linkDiv.style.top = "10px"; // Располагаем выше времени
      linkDiv.style.left = "10px";
      linkDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      linkDiv.style.color = "white";
      linkDiv.style.padding = "5px";
      linkDiv.style.fontSize = "20px";
      linkDiv.style.zIndex = "1000";
      linkDiv.textContent = `${url}`;
      document.body.appendChild(linkDiv);

      // Создаем элемент <div> для отображения даты и времени
      const dateTimeDiv = document.createElement("div");
      dateTimeDiv.style.position = "fixed";
      dateTimeDiv.style.top = "45px"; // Ниже ссылки
      dateTimeDiv.style.left = "10px";
      dateTimeDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      dateTimeDiv.style.color = "white";
      dateTimeDiv.style.padding = "5px";
      dateTimeDiv.style.fontSize = "20px";
      dateTimeDiv.style.zIndex = "1000";
      dateTimeDiv.textContent = `${dateTimeString}`;
      document.body.appendChild(dateTimeDiv);
    },
    url,
    dateTimeString
  );
}

// Функция для создания скриншота по ID товара
async function takeScreenshotForId(browser, itemId) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const url = `https://www.wildberries.ru/catalog/${itemId}/detail.aspx`;

  try {
    // Переход на страницу товара
    await page.goto(url, { waitUntil: "networkidle2" }); // Ждем полной загрузки страницы

    // Добавляем ссылку и текущую дату/время на страницу
    await addLinkAndTimestampToPage(page, url);

    // Делаем скриншот и сохраняем его с именем по ID товара
    const screenshotPath = path.join(__dirname, `/results/${itemId}.jpg`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: "jpeg",
    });

    console.log(`Скриншот для товара ${itemId} сохранен в файл ${itemId}.jpg`);
  } catch (error) {
    console.error(`Ошибка при создании скриншота для товара ${itemId}:`, error);
  } finally {
    await page.close();
  }
}

// Основная функция
async function takeScreenshots(filePath) {
  // Очищаем папку перед запуском
  clearResultsFolder();

  const itemIds = readIdsFromFile(filePath); // Чтение ID из файла

  if (itemIds.length === 0) {
    console.log("Файл пуст или содержит неверные данные.");
    return;
  }

  const browser = await puppeteer.launch({
    headless: true, // Запуск в headless режиме
    defaultViewport: null, // Чтобы разрешение работало как нужно
    args: ["--window-size=1920,1080"], // Устанавливаем размер окна
  });

  for (const itemId of itemIds) {
    await takeScreenshotForId(browser, itemId);
  }

  await browser.close(); // Закрываем браузер
}

// Запуск программы, передаем путь к файлу с ID
const filePath = "./ids.txt"; // Укажите путь к вашему текстовому файлу с ID
takeScreenshots(filePath);
