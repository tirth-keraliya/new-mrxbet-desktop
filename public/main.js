const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Notification,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");
const { setup: setupPushReceiver } = require("electron-push-receiver");

let mainWindow;
let tray = null;
let forceQuit = false;

// Function to create the main app window
const createWindow = async () => {
  const { default: isDev } = await import("electron-is-dev");
  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 600,
    height: 788,
    icon: path.join(__dirname, "images", "icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
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

    mainWindow.on("close", (event) => {
      if (!forceQuit) {
        event.preventDefault();
        mainWindow.hide(); // Hide the window instead of closing it
      } else {
        mainWindow = null; // Allow the window to be cleaned up on quit
      }
    });
  }

  return mainWindow;
};

// Function to create the tray icon
const createTray = (iconName = "icon") => {
  // Check if the tray already exists
  if (tray) {
    console.log("Tray icon already exists.");
    return; // Exit if the tray is already created
  }

  let iconPath;
  if (process.platform === "darwin") {
    iconPath = path.join(__dirname, "../images", `icon.png`);
  } else {
    iconPath = path.join(__dirname, "../images", `icon.png`);
  }

  // Load the icon using nativeImage and resize it for tray
  let trayIcon = nativeImage.createFromPath(iconPath);

  if (process.platform === "darwin") {
    trayIcon = trayIcon.resize({ width: 16, height: 16 }); // For macOS
  } else {
    trayIcon = trayIcon.resize({ width: 16, height: 16 }); // For Windows
  }

  tray = new Tray(trayIcon); // Set the resized tray icon

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

const updateDockIcon = (iconName) => {
  if (process.platform === "darwin") {
    const dockIconPath = path.resolve(
      app.getAppPath(),
      `images/${iconName}.png`
    );
    const dockIcon = nativeImage.createFromPath(dockIconPath);

    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon); // Set the dynamic .png dock icon
      console.log(`Dock icon changed to: ${dockIconPath}`);
    } else {
      console.error(`Failed to load dock icon: ${dockIconPath}`);
    }
  }
};

// IPC listener to dynamically change both the app icon, tray icon, and overlay icon
ipcMain.on("change-app-icon", (event, iconName) => {
  let iconPath;

  if (process.platform === "darwin") {
    iconPath = path.resolve(app.getAppPath(), `../images/${iconName}.png`);
  } else {
    iconPath = path.resolve(app.getAppPath(), `images/${iconName}.ico`);
  }

  if (mainWindow) {
    try {
      // Change the window icon
      if (process.platform !== "darwin") {
        mainWindow.setIcon(iconPath);
        console.log(`App icon changed to: ${iconPath}`);
      }
      // Change the tray icon
      createTray(iconName);
      updateDockIcon(iconName);

      if (process.platform === "win32") {
        // Windows: Change the overlay icon (this is Windows-only functionality)
        const overlayIconPath = path.join(__dirname, `images/${iconName}.ico`);
        mainWindow.setOverlayIcon(overlayIconPath, "Overlay description");
        console.log(`Overlay icon changed to: ${overlayIconPath}`);
      }
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
    const deepLink = commandLine.find((arg) =>
      arg.startsWith("https://mrxbet.net/")
    );
    console.log(`deeplink command new: ${deepLink}`);
    if (deepLink) {
      // Extract playerid using URLSearchParams
      const url = new URL(deepLink);
      console.log(`url new: ${url}`);
      console.log(`deeplink new: ${deepLink}`);
      const playerid = url.searchParams.get("playerid");

      // Check if playerid exists and is valid
      if (playerid) {
        // Send the deep-link with playerid to the renderer process
        mainWindow.webContents.send("deep-link", { screen: "home", playerid });
      }
    }
  }
});

// Register protocol and handle deep links for Windows

// Handle open-url event for macOS
app.on("open-url", (event, url) => {
  console.log(`url new open-url: ${url}`);
  console.log(`url new open-event: ${JSON.stringify(event)}`);
  event.preventDefault();
  if (mainWindow) {
    // Send deep link to renderer process
    mainWindow.webContents.send("deep-link", url);
  }
});
app.setAsDefaultProtocolClient("mrxbet");

// Function to initialize the app
const setupApp = async () => {
  await app.whenReady();
  await createWindow();
  createTray(); // Initialize with the default tray icon
  setupIPC();

  app.on("activate", () => {
    if (mainWindow === null || BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });

  app.on("before-quit", () => {
    forceQuit = true; // Ensure the app can quit without issues
  });

  app.on("ready", () => {
    createWindow(); // Create the main window on app start
  });

  app.on("window-all-closed", () => {
    // Only quit the app on non-macOS platforms
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
};

setupApp();
