import { BrowserWindow } from "electron";

export class NotificationService {
    private static instance: NotificationService;
    private mainWindow: BrowserWindow | null;

    private constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    
        this.mainWindow.on("closed", () => {
            this.mainWindow = null;
        });
    }    

    // Singleton Pattern - Ensures a single instance of NotificationService
    public static getInstance(mainWindow: BrowserWindow): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService(mainWindow);
        }
        return NotificationService.instance;
    }

    /**
     * Displays an in-app notification inside the Electron window.
     * @param message The message to display.
     * @param type The type of notification ('error', 'warning', 'info').
     */
    public showNotification(message: string, type: "error" | "warning" | "info" = "error"): void {
        if (!this.mainWindow || this.mainWindow.isDestroyed() || !this.mainWindow.webContents) return;
    
        this.mainWindow.webContents.executeJavaScript(`
            (function() {
                let existingAlert = document.getElementById('custom-alert');
                if (existingAlert) existingAlert.remove(); // Remove old alerts
    
                let alertBox = document.createElement('div');
                alertBox.id = 'custom-alert';
                alertBox.style.position = 'fixed';
                alertBox.style.top = '20px';
                alertBox.style.right = '20px';
                alertBox.style.padding = '15px';
                alertBox.style.color = 'white';
                alertBox.style.borderRadius = '5px';
                alertBox.style.zIndex = '9999';
                alertBox.style.fontSize = '16px';
                alertBox.style.fontWeight = 'bold';
                alertBox.style.display = 'flex';
                alertBox.style.alignItems = 'center';
                alertBox.style.justifyContent = 'space-between';
                alertBox.style.minWidth = '250px';
    
                // Set background color based on type
                switch (${JSON.stringify(type)}) {
                    case 'error':
                        alertBox.style.background = 'rgba(255,0,0,0.9)'; // Red for errors
                        break;
                    case 'warning':
                        alertBox.style.background = 'rgba(255,165,0,0.9)'; // Orange for warnings
                        break;
                    default:
                        alertBox.style.background = 'rgba(0,0,0,0.8)'; // Default: Dark background
                }
    
                alertBox.innerText = ${JSON.stringify(message)};
    
                // Add a close button
                let closeButton = document.createElement('button');
                closeButton.innerText = '✖';
                closeButton.style.marginLeft = '10px';
                closeButton.style.background = 'transparent';
                closeButton.style.color = 'white';
                closeButton.style.border = 'none';
                closeButton.style.cursor = 'pointer';
                closeButton.style.fontSize = '16px';
                closeButton.onclick = () => alertBox.remove();
    
                alertBox.appendChild(closeButton);
                document.body.appendChild(alertBox);
    
                // Auto remove after 5 seconds
                //setTimeout(() => alertBox.remove(), 5000);
            })();
        `);
    }    
}
