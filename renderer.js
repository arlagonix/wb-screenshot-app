const { ipcRenderer } = require("electron");

let selectedFilePath = null;

// Обработка нажатия на кнопку выбора файла
document
  .getElementById("select-file-button")
  .addEventListener("click", async () => {
    const filePath = await ipcRenderer.invoke("select-file");

    if (filePath) {
      selectedFilePath = filePath;
      document.getElementById(
        "selected-file"
      ).textContent = `Выбран файл: ${filePath}`;
      document.getElementById("start-button").disabled = false;
      document.getElementById("stop-button").disabled = true; // Отключаем кнопку остановки, пока процесс не запущен
    }
  });

// Обработка нажатия на кнопку старта
document.getElementById("start-button").addEventListener("click", async () => {
  if (selectedFilePath) {
    document.getElementById("status").textContent = "Создание скриншотов...";
    document.getElementById("start-button").disabled = true; // Отключаем кнопку запуска
    document.getElementById("select-file-button").disabled = true; // Отключаем кнопку выбора файла
    document.getElementById("stop-button").disabled = false; // Включаем кнопку остановки
    await ipcRenderer.invoke("start-screenshots", selectedFilePath);
    document.getElementById("start-button").disabled = false;
    document.getElementById("select-file-button").disabled = false;
    document.getElementById("stop-button").disabled = true;
  }
});

// Обработка нажатия на кнопку остановки
document.getElementById("stop-button").addEventListener("click", async () => {
  await ipcRenderer.invoke("stop-screenshots");
  document.getElementById("status").textContent = "Остановка процесса...";
  document.getElementById("start-button").disabled = false;
  document.getElementById("select-file-button").disabled = false;
  document.getElementById("stop-button").disabled = true;
});

// Обновление прогресса
ipcRenderer.on("progress-update", (event, message) => {
  document.getElementById("status").textContent = message;
});
