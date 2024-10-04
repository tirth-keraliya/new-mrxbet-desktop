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
const { setup: setupPushReceiver } = require("@cuj1559/electron-push-receiver");

const { google } = require("googleapis");

// Load your Firebase service account key
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, "service-account.json");
console.log("SERVICE_ACCOUNT_KEY_PATH", SERVICE_ACCOUNT_KEY_PATH);
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
      devTools: true,
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

// Function to generate OAuth 2.0 token
async function getOAuthToken() {
  try {
    // const auth = new google.auth.GoogleAuth({
    //   keyFile: SERVICE_ACCOUNT_KEY_PATH,
    //   scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    // });
    // console.log("Auth object initialized:", auth); // Debugging

    // const accessToken = await auth.getAccessToken();
    // console.log("Access token generated:", accessToken); // Debugging
    return "accessToken";
  } catch (error) {
    console.error("Error in getOAuthToken:", error);
    throw error;
  }
}
// IPC listener to fetch OAuth 2.0 token
// ipcMain.on("getAccessToken", async (event) => {
//   try {
//     const token = await getAccessToken();
//     event.sender.send("accessToken", token);
//   } catch (error) {
//     console.error("Error getting access token:", error);
//   }
// });
ipcMain.handle("get-oauth-token", async () => {
  try {
    const token = await getOAuthToken();
    return token;
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    throw error;
  }
});

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
  console.log("yeyeyeyeyeyeyeyeyeyeyeyeyeye", event, arg);
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

function getGoogleAccessToken() {
  return new Promise(function (resolve, reject) {
    const jwtClient = new google.auth.JWT(
      "firebase-adminsdk-lh1at@mrxbettest.iam.gserviceaccount.com",
      null,
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+QWt9wybLiOM6\n/7LpPgVasKOwET2wG/ON6XaMy9AJrJKYUai9HUSiFUXPkfvLgWYBQ7cniyUV/EF3\npGVZciPRm/QZNlAXm6I7wABtiHimyuQaDkD1wHbte4I1tT6aAZX1AjbZRQAigHUK\nn+C7bwRQlUR59AoKat433kFk0zlY2MZMiTl3DIOlchE1bu11EiWlpvomsvNHP0qe\nrRS4D4+a0/ebJBz4XCddsbL9ASgzRLBkAH0w35BYftaSKUe6wKvXwQKMedPu/mwK\nssNVHq+wZEQbjSVynwADBVQubCZYy5484+9QHo0hWjbeSultSkIFsnW2i202A0dS\nmPy99mPTAgMBAAECggEADcsxb2dIN0Z/7wWd45I3EimvXHMLjWqhYF8WVMPsG99y\nq290M+3czYGMU63KWylRC3Ns4oWQlUT6PCHjpTYEycwsSO2qpeOHQhy8CzTzRmh8\nXDU/WXHwTWyAdsNivAi0ZhSYhG0fwuCcW75WrVAxuGPyGINsfO/dl6BaDmTQChRh\nPIljYONLIDgyN3uBKiCpm6XBtY/o1oWa7pGss5HvKMKURuHkAibYyNHF4s2voVwn\nCpCuxloPu2O3EmoYk6PS74RaAqFPE5qVSXrsYD7LYa4740L/LNZ2muBaNPH/HZ7/\n+Xcds1S3p9WzSOy4+PxkQN5BLx3FhwEF5QnQ/KDDoQKBgQDyI38ap49kD3nQrz6p\n4iFpKG/eplTMAqJJFqXz1Ens8t3tHaNltmMXxvgyEQDDSUxJ1zV5erEx+iLXY2X0\nuSn6iybEnVvJnSstpUnD407fRAh2Bh2CxO56DYM0fyj0vrTEWSy86Xkmq2ZrHaxq\n4RJB/Bc5+V8kvqInfy2QMXVDswKBgQDJJZWrEPfGeKt6z2xiMkQgVbQH2IhDo2oK\nRvAUx+/WEmkfLm2fQL3TZf03gmW2/oJp59WVSZKMu6bH+lucL7acbiA7/tUbDalH\nY+rMCUC8KqYElM8qAFScaGC99hnJEqJqjZZSkZ41UksEeprIRKZGY0kRJ9OJ6bSI\nUYJSGQ7PYQKBgFf4cXs7mSrfPICGyptp3n2YBVy8zV35LwCiy9QUMm91pQ86j1yq\nsMG4tf9qkf5hKOhC2diyrKHdoL7kC+ynQQsXdxRDn09WXJOO04fpk4Ql8XT/r8UM\nyx9ovVxbPoP8rSwQweI4aJ2V8/XCqBuEfd+fOMkFQn3VDJCQ8frLHTFlAoGBAMKj\nE8iMirYKXiRgQkhiy3ledO6CoJiSsDFxoy74qSNEfWQm0Pyg8Q52SihEjZgdfqRs\nKUhkAOMdUa2AnNTtdo64IYjsddnPxlXGYZU9/t4VhsA4Hp5N45HVjodCdIEU/wSM\nLUGIlsaR8vVKjivsAdlqiXGIUDHLa13dQXWfua0BAoGAcDZ51tXwWiif8CDw4A2L\nQosNw6Dnr/KAftyXYw3PoEUCpftL4fCcu7VbsSAcUXl1ZJZ+yXck5gLYYleiQH93\nPn4hX4S8OQmJc3IO/8iczQPcGknGKUtMzGbQPPVDrdhhs/akw2KBKFcrpz/QXNZl\n/Xjj6uiB5Q0cGwMLaVr3fj8=\n-----END PRIVATE KEY-----\n",
      ["https://www.googleapis.com/auth/firebase.messaging"],
      null
    );

    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      console.log("tokens--tokens--jwt", tokens);
      resolve(tokens.access_token);
    });
  });
}

function initFcmToken(token) {
  getGoogleAccessToken().then((resolve, _) => {
    if (resolve != null) {
      console.log("Service successfully started\nOAuth:", resolve);

      fetch(
        "https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/" + "news",
        {
          method: "POST",
          headers: new Headers({
            Authorization: "Bearer " + resolve,
            "Content-Type": "application/json",
            access_token_auth: true,
          }),
        }
      )
        .then((response) => {
          if (response.status < 200 || response.status >= 400) {
            // Read the error message correctly
            return response.json().then((errorData) => {
              throw new Error(
                "Error subscribing to topic: " +
                  response.status +
                  " - " +
                  JSON.stringify(errorData)
              );
            });
          }
          console.log('Subscribed to "' + "news" + '"');
        })
        .catch((error) => {
          console.error(error.message || error);
        });
    }
  });
}

// Function to set up IPC handlers for FCM token management
const setupIPC = async () => {
  const Store = (await import("electron-store")).default; // Dynamic import
  const store = new Store();

  ipcMain.on("storeFCMToken", (event, token) => {
    console.log("Stored FCM Token:", token);
    token && initFcmToken(token);
    store.set("fcm_token", token);
  });

  ipcMain.on("getFCMToken", (event) => {
    const token = store.get("fcm_token");
    console.log(
      "getFCMTokengetFCMTokengetFCMTokengetFCMTokengetFCMToken--main",
      token
    );
    event.sender.send("getFCMToken", token);
  });
};

// Handle Branch deep links
app.on("second-instance", (event, commandLine) => {
  if (mainWindow && commandLine.length >= 2) {
    const deepLink = commandLine.find((arg) => arg.startsWith("mrxbet://"));
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
  setupIPC();
  createTray(); // Initialize with the default tray icon

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
