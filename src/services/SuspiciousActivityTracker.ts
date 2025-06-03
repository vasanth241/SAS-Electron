import { BrowserWindow, app } from "electron";
import { NotificationService } from "./NotificationService"; // Import Notification Service

export class SuspiciousActivityTracker {
    private blurCount: number = 0;
    private isAppLocked: boolean = false;
    private readonly MAX_BLUR_COUNT = 3;
    private win: BrowserWindow;
    private notificationService: NotificationService;

    constructor(win: BrowserWindow, notificationService: NotificationService) {
        this.win = win;
        this.notificationService = notificationService;
        this.setupListeners();
    }

    private setupListeners(): void {
        this.win.on("blur", () => this.trackSuspiciousActivity());
    }

    private trackSuspiciousActivity(): void {
        if (this.isAppLocked) return;

        this.blurCount++;
        const remainingBlurs = this.MAX_BLUR_COUNT - this.blurCount;

        if (remainingBlurs >= 0) {
            this.notificationService.showNotification(
                `You moved out of the application. You can do this ${remainingBlurs} more time(s) before the app locks.`,
                "warning"
            );
        }

        if (this.blurCount > this.MAX_BLUR_COUNT) {
            this.isAppLocked = true;
            console.warn("Suspicious activity detected! Locking application...");

            this.lockApplication();

            setTimeout(() => {
                console.warn("Application quitting due to suspicious activity.");
                app.quit();
            }, 10000);
        }
    }

    private lockApplication(): void {
        if (!this.win || !this.isAppLocked) return;

        this.isAppLocked = true;
        this.win.webContents.executeJavaScript(`
            document.body.style.pointerEvents = 'none'; // Disable mouse clicks
            document.body.style.userSelect = 'none'; // Disable text selection

            document.addEventListener('keydown', (event) => event.preventDefault(), true);
            document.addEventListener('keyup', (event) => event.preventDefault(), true);

            document.addEventListener('mousedown', (event) => event.preventDefault(), true);
            document.addEventListener('mouseup', (event) => event.preventDefault(), true);

            document.body.style.overflow = 'hidden';
            document.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
            document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
        `);

        this.notificationService.showNotification(
            `⚠️ Suspicious Activity Detected!,
            The application is locked and will close automatically in 10 seconds.`
        );
    }
}
