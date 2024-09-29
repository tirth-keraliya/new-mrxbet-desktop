const { contextBridge, ipcRenderer } = require("electron");

// Expose functions to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  openLink: (url) => ipcRenderer.send("open-link", url),
  // changeIcon: (iconName) => ipcRenderer.send("change-app-icon", iconName),
  changeIcon: (iconName) => ipcRenderer.send("change-app-icon", iconName),
  onDeepLink: (callback) =>
    ipcRenderer.on("deep-link", (event, deepLink) => callback(deepLink)),
});
// contextBridge.exposeInMainWorld("electronAPI", {
// });

contextBridge.exposeInMainWorld("electron", {
  getFCMToken: (channel, callback) => ipcRenderer.on(channel, callback),
  getAccessToken: (channel, callback) => ipcRenderer.on(channel, callback),
  getOAuthToken: (callback) => ipcRenderer.invoke("get-oauth-token").then(callback),
});

window.electron.getFCMToken('fcm-token-channel', (event, token) => {
  window.electron.getOAuthToken('oauth-token-channel', (event, accessToken) => {
    fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/news`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (response.ok) {
        console.log(`Subscribed to topic`);
      } else {
        console.error('Error subscribing to topic:', response.statusText);
      }
    })
    .catch(err => console.error('Fetch error:', err));
  });
});


// Start FCM service with your sender ID
const senderId = "1020073407571"; // Replace with your FCM sender ID
ipcRenderer.send("PUSH_RECEIVER:::START_NOTIFICATION_SERVICE", senderId);

ipcRenderer.on("PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED", (_, token) => {
  ipcRenderer.send("storeFCMToken", token);
});

ipcRenderer.on("PUSH_RECEIVER:::NOTIFICATION_RECEIVED", (_, notification) => {
  console.log("Full Notification Content:", JSON.stringify(notification));

  ipcRenderer.send("send-notification", notification);
});

ipcRenderer.on("PUSH_RECEIVER:::TOKEN_UPDATED", (_, token) => {
  ipcRenderer.send("storeFCMToken", token);
});

const postMessage = (type, args) => {
  window.postMessage(
    JSON.stringify({
      type: "sc-desktop-app",
      args: { type: type, data: args },
    }),
    "*"
  );
};

ipcRenderer.on("app-main-notification-clicked", (_, args) => {
  postMessage("app-notification-clicked", JSON.parse(args));
});
