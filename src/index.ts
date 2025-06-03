import { app, BrowserWindow, session } from 'electron';
import * as path from "path";
import { NotificationService } from "./services/NotificationService";
import { IdleTracker } from "./services/IdleTracker";
import { SuspiciousActivityTracker } from "./services/SuspiciousActivityTracker";
import { ExternalMonitorService } from "./services/ExternalMonitorService";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from './config';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    title: 'Assessment App',
    icon: path.join(__dirname, "assets/icons/app-icon.ico"),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      devTools: false,
      nodeIntegration: false,
      enableBlinkFeatures: "USB",
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL("http://www.catipsum.com/");
  mainWindow.setContentProtection(true);

  const notificationService = NotificationService.getInstance(mainWindow);
  const idleTracker = new IdleTracker(notificationService);
  idleTracker.startTracking();

  new SuspiciousActivityTracker(mainWindow, notificationService);
  new ExternalMonitorService(mainWindow, notificationService);
    
  mainWindow.webContents.on("before-input-event", (event, input) => {
    idleTracker.resetIdleTime();
    if (input.control || input.meta) event.preventDefault();
  });
  
  mainWindow.webContents.on("input-event", () => idleTracker.resetIdleTime());
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});