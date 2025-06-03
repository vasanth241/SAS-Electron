import { NotificationService } from "./NotificationService";
import { MAX_IDLE_THRESHOLD } from "../config";

export class IdleTracker {
    private notificationService: NotificationService;
    private idleTime: number = 0;
    private idleThreshold: number = MAX_IDLE_THRESHOLD;
    private interval: NodeJS.Timeout | null = null;

    constructor(notificationService: NotificationService) {
        this.notificationService = notificationService;
    }

    public startTracking(): void {
        this.interval = setInterval(() => {
            this.idleTime++;

            if (this.idleTime >= this.idleThreshold) {
                this.notificationService.showNotification("⏳ You have been idle for too long!", "warning");
                this.resetIdleTime();
            }
        }, 1000);
    }

    public resetIdleTime(): void {
        this.idleTime = 0;
    }

    public stopTracking(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
