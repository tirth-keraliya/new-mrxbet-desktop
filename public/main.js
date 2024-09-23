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
  mainWindow.loadURL("http://localhost:3000");

  // Example to change icon dynamically
  // mainWindow.on("ready-to-show", () => {
  //   // Change the icon dynamically here
  //   mainWindow.setIcon(path.join(__dirname, "images/platinum.ico")); // Set new icon
  // });
  const appUrl = isDev
    ? "http://localhost:3000" // Dev mode (React's development server)
    : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(appUrl);

  setupPushReceiver(mainWindow.webContents);

  app.setAppUserModelId("MrxBet");

  ipcMain.on("change-app-icon", (event, iconName) => {
    let iconPath;

    // For macOS, use .icns files and ensure correct path
    if (process.platform === "darwin") {
      iconPath = path.join(app.getAppPath(), "build", `${iconName}.icns`);
      // You can also use path.resolve for a more reliable path
      iconPath = path.resolve(__dirname, `images/${iconName}.icns`);
    } else {
      // For Windows/Linux, use .ico files
      iconPath = path.join(__dirname, `images/${iconName}.ico`);
    }

    // Check if the window exists and then set the icon dynamically
    if (mainWindow) {
      try {
        mainWindow.setIcon(iconPath); // Update the Electron app window icon
      } catch (err) {
        console.error(`Failed to set icon: ${err}`);
      }
    }
  });
  mainWindow.loadURL(appUrl).catch((err) => {
    console.error("Failed to load URL:", err);
  });

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

const createTray = () => {
  tray = new Tray(path.join(__dirname, "images", "icon.ico")); // Set your tray icon
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
};

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
    // Handle the deep link in the renderer process
    mainWindow.webContents.send("deep-link", url);
  }
});

const setupApp = async () => {
  await app.whenReady();
  await createWindow();
  createTray();
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
