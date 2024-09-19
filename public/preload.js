const { contextBridge, ipcRenderer } = require("electron");

// Expose functions to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  openLink: (url) => ipcRenderer.send("open-link", url),
});

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  getFCMToken: (channel, func) => {
    ipcRenderer.once(channel, func);
    ipcRenderer.send("getFCMToken");
  },
});

// Start FCM service with your sender ID
const senderId = "296794513025"; // Replace with your FCM sender ID
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
