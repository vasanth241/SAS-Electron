import * as usb from "usb";
import { exec } from "child_process";
import { BrowserWindow } from "electron";
import { NotificationService } from "./NotificationService"; // Adjust path

export class KeyboardService {
    private mainWindow: BrowserWindow;
    private notificationService: NotificationService;

    constructor(mainWindow: BrowserWindow, notificationService: NotificationService) {
        this.mainWindow = mainWindow;
        this.notificationService = notificationService;
        this.checkKeyboardsInitially();
        this.setupUSBListeners();
    }

    private detectUSBKeyboards(): boolean {
        const devices = usb.getDeviceList();
        const excludeVendorIds = [0x05ac /* Apple */, 0x413c /* Dell */];
        const keyboards = devices.filter(device => {
            const descriptor = device.deviceDescriptor;
            const isHID = descriptor.bDeviceClass === 3;

            if (!isHID) return false;

            try {
                device.open();
                const interfaces = device.interfaces;
                const hasKeyboardInterface = interfaces.some((iface) => { // Remove 'usb.' prefix
                    return (
                        iface.descriptor.bInterfaceClass === 3 &&
                        iface.descriptor.bInterfaceProtocol === 1
                    );
                });
                device.close();
                return hasKeyboardInterface && !excludeVendorIds.includes(descriptor.idVendor);
            } catch (err) {
                console.error("Error inspecting USB device:", err);
                device.close();
                return false;
            }
        });
        console.log("USB Keyboards:", keyboards);
        return keyboards.length > 0;
    }

    private detectBluetoothKeyboards(): Promise<boolean> {
        const platform = process.platform;
        return new Promise((resolve) => {
            let command: string;

            if (platform === "win32") {
                command = "powershell Get-PnpDevice | Where-Object {$_.Class -eq 'Keyboard' -and $_.Service -eq 'BTHUSB'}";
            } else if (platform === "darwin") {
                command = "system_profiler SPBluetoothDataType | grep -i Keyboard";
            } else if (platform === "linux") {
                command = "bluetoothctl paired-devices | grep -i Keyboard";
            } else {
                console.error("Unsupported platform:", platform);
                resolve(false);
                return;
            }

            exec(command, (err, stdout) => {
                if (err) {
                    console.error(`${platform} Bluetooth check error:`, err);
                    resolve(false);
                } else {
                    resolve(stdout.trim().length > 0);
                }
            });
        });
    }

    public async checkKeyboards(): Promise<{ usbConnected: boolean; bluetoothConnected: boolean }> {
        const usbConnected = this.detectUSBKeyboards();
        const bluetoothConnected = await this.detectBluetoothKeyboards();

        const keyboardConnected = usbConnected || bluetoothConnected;
        console.log("Keyboard status:", { usbConnected, bluetoothConnected });

        if (keyboardConnected) {
            this.mainWindow.webContents.send("keyboard-detected", {
                usbConnected,
                bluetoothConnected,
            });
        }

        return { usbConnected, bluetoothConnected };
    }

    private checkKeyboardsInitially() {
        setTimeout(async () => {
            await this.checkKeyboards();
        }, 1000);
    }

    private setupUSBListeners() {
        usb.on("attach", async (device) => {
            console.log("USB device attached:", device);
            await this.checkKeyboards();
        });

        usb.on("detach", async (device) => {
            console.log("USB device detached:", device);
            await this.checkKeyboards();
        });
    }
}