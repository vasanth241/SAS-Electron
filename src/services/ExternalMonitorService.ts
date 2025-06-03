import { screen, BrowserWindow } from "electron";
import { NotificationService } from "./NotificationService";

export class ExternalMonitorService {
    private mainWindow: BrowserWindow;
    private notificationService: NotificationService;

    constructor(mainWindow: BrowserWindow, notificationService: NotificationService) {
        this.mainWindow = mainWindow;
        this.notificationService = notificationService;
        this.checkExternalMonitor();
        this.setupListeners();
    }

    private setupListeners(): void {
        screen.on("display-added", () => this.handleMonitorChange(true));
        screen.on("display-removed", () => this.handleMonitorChange(false));
    }

    private checkExternalMonitor(): void {
        const displays = screen.getAllDisplays();
        if (displays.length > 1) {
            if (this.isScreenMirrored(displays)) {
                this.notifyScreenMirroring();
            } else {
                this.notifyExternalMonitor();
            }
        }
    }

    private handleMonitorChange(added: boolean): void {
        const displays = screen.getAllDisplays();

        if (added) {
            console.log("External monitor connected.");
            if (this.isScreenMirrored(displays)) {
                this.notifyScreenMirroring();
            } else {
                this.notifyExternalMonitor();
            }
        } else {
            console.log("External monitor disconnected.");
            this.notificationService.showNotification("External monitor disconnected.", "info");
        }
    }

    private isScreenMirrored(displays: Electron.Display[]): boolean {
        if (displays.length < 2) return false;

        const firstDisplay = displays[0];

        return displays.some((display, index) => {
            if (index === 0) return false; // Skip the first display
            return (
                display.bounds.width === firstDisplay.bounds.width &&
                display.bounds.height === firstDisplay.bounds.height &&
                display.scaleFactor === firstDisplay.scaleFactor
            );
        });
    }

    private notifyExternalMonitor(): void {
        this.notificationService.showNotification("⚠️ External monitor detected! Please disconnect the external monitor.", "warning");
    }

    private notifyScreenMirroring(): void {
        this.notificationService.showNotification("⚠️ Screen mirroring detected! Please disconnect the external monitor.", "warning");
    }
}
