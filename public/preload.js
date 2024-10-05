const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openLink: (url) => ipcRenderer.send("open-link", url),
  changeIcon: (iconName) => ipcRenderer.send("change-app-icon", iconName),
  onDeepLink: (callback) =>
    ipcRenderer.on("deep-link", (event, deepLink) => callback(deepLink)),
});

contextBridge.exposeInMainWorld("electron", {
  getFCMToken: (channel, callback) => ipcRenderer.on(channel, callback),
  getAccessToken: (channel, callback) => ipcRenderer.on(channel, callback),
});

ipcRenderer.send(
  "PUSH_RECEIVER:::START_NOTIFICATION_SERVICE",
  "1:906015690862:web:e8bdd5543600a57935967f",
  "mrxbettest",
  "AIzaSyDaE6sDp8avtnh--XmnwNjjcVTLAD4dw6w",
  "BKH8GiF267RoPmnRNwspiz3Yt3NAv0QVhPg-QyAIMUP9wREO40RXCpbVdJvKb87Q34Df17xpQJEOTDNWO3s03wI"
);

ipcRenderer.on("PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED", (_, token) => {
  console.log("PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED", token);
  ipcRenderer.send("storeFCMToken", token);
});

ipcRenderer.on("PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR", (event, token) => {
  console.log("PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR", event, token);
});

ipcRenderer.on("PUSH_RECEIVER:::NOTIFICATION_RECEIVED", (_, notification) => {
  console.log("PUSH_RECEIVER:::NOTIFICATION_RECEIVED", JSON.stringify(notification));

  ipcRenderer.send("send-notification", notification);
});

ipcRenderer.on("PUSH_RECEIVER:::TOKEN_UPDATED", (_, token) => {
  console.log("PUSH_RECEIVER:::TOKEN_UPDATED", token);
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
