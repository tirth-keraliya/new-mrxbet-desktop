const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Notification,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const { setup: setupPushReceiver } = require("electron-push-receiver");

let mainWindow;
let tray;
let forceQuit = false;

// Function to create the main app window
const createWindow = async () => {
  const { default: isDev } = await import("electron-is-dev");
  mainWindow = new BrowserWindow({
    autoHideMenuBar: false,
    width: 344,
    height: 788,
    icon: path.join(__dirname, "images", "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  const appUrl = isDev
    ? "http://localhost:3000" // Dev mode (React's development server)
    : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(appUrl);

  setupPushReceiver(mainWindow.webContents);

  app.setAppUserModelId("MrxBet");

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.platform === "darwin") {
    app.on("before-quit", function () {
      forceQuit = true;
    });

    mainWindow.on("close", function (event) {
      if (!forceQuit) {
        event.preventDefault();
        mainWindow.hide();
      }
    });
  }

  return mainWindow;
};

// Function to create the tray icon
const createTray = (iconName = "icon") => {
  let iconPath;
  if (process.platform === "darwin") {
    iconPath = path.join(__dirname, "images", `${iconName}.icns`);
  } else {
    iconPath = path.join(__dirname, "images", `${iconName}.ico`);
  }

  tray = new Tray(iconPath); // Set your tray icon
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open App", click: () => mainWindow.show() },
    {
      label: "Exit",
      click: () => {
        forceQuit = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("MrxBet");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.show(); // Show the app window when tray icon is clicked
  });

  console.log(`Tray icon set to: ${iconPath}`);
};

// IPC listener to dynamically change both the app icon, tray icon, and overlay icon
ipcMain.on("change-app-icon", (event, iconName) => {
  let iconPath;

  if (process.platform === "darwin") {
    iconPath = path.resolve(app.getAppPath(), `images/${iconName}.icns`);
  } else {
    iconPath = path.resolve(app.getAppPath(), `images/${iconName}.ico`);
  }

  if (mainWindow) {
    try {
      // Change the window icon
      mainWindow.setIcon(iconPath);
      console.log(`App icon changed to: ${iconPath}`);

      // Change the tray icon
      createTray(iconName);
      console.log(`Tray icon changed to: ${iconPath}`);

      // Change the overlay icon using the specified path
      const overlayIconPath =
        process.platform === "darwin"
          ? path.join(__dirname, `images/${iconName}.icns`)
          : path.join(__dirname, `images/${iconName}.ico`);
      mainWindow.setOverlayIcon(overlayIconPath, "Overlay description"); // Set the overlay icon
      console.log(`Overlay icon changed to: ${overlayIconPath}`);
    } catch (err) {
      console.error(`Failed to set icons: ${err}`);
    }
  }
});

// IPC listener for sending notifications
ipcMain.on("send-notification", (event, arg) => {
  const notification = new Notification({
    title: arg?.notification.title,
    body: arg?.notification.body,
    data: arg.data,
    silent: false,
    requireInteraction: true,
    icon: path.join(__dirname, "images", "icon.ico"),
    type: "info",
    sound: "Default",
  });

  notification.show();
  const launchOptions = "sc-open:" + JSON.stringify(JSON.stringify(arg));
  const options = {
    title: arg?.notification.title,
    body: arg?.notification.body,
    launch: launchOptions,
  };
  notification.on("click", () => {
    mainWindow.webContents.send("app-main-notification-clicked", arg);
    mainWindow.webContents.send("activate", [null, options.launch]);
    mainWindow.show();
  });
});

// Function to set up IPC handlers for FCM token management
const setupIPC = async () => {
  const Store = (await import("electron-store")).default; // Dynamic import
  const store = new Store();

  ipcMain.on("storeFCMToken", (event, token) => {
    store.set("fcm_token", token);
  });

  ipcMain.on("getFCMToken", (event) => {
    const token = store.get("fcm_token");
    event.sender.send("getFCMToken", token);
  });
};

// Handle Branch deep links
app.on("second-instance", (event, commandLine) => {
  if (mainWindow && commandLine.length >= 2) {
    const deepLink = commandLine.find((arg) => arg.startsWith("mrxbet://"));
    if (deepLink) {
      mainWindow.webContents.send("deep-link", deepLink);
    }
  }
});

// Register protocol and handle deep links for Windows
app.setAsDefaultProtocolClient("mrxbet");

// Handle open-url event for macOS
app.on("open-url", (event, url) => {
  console.log("Deep link:", url);
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send("deep-link", url);
  }
});

// Function to initialize the app
const setupApp = async () => {
  await app.whenReady();
  await createWindow();
  createTray(); // Initialize with the default tray icon
  setupIPC();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });

  app.on("before-quit", () => {
    forceQuit = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
};

setupApp();
