// usb.d.ts
declare module "usb" {
    interface DeviceDescriptor {
        bDeviceClass: number;
        idVendor: number;
    }

    interface InterfaceDescriptor {
        bInterfaceClass: number;
        bInterfaceProtocol: number;
    }

    interface Interface {
        descriptor: InterfaceDescriptor;
    }

    interface Device {
        deviceDescriptor: DeviceDescriptor;
        interfaces: Interface[];
        open(): void;
        close(): void;
    }

    interface Usb extends NodeJS.EventEmitter {
        getDeviceList(): Device[];
        on(event: "attach" | "detach", callback: (device: Device) => void): this;
    }

    const usb: Usb;
    export = usb;
}