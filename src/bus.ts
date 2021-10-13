import {
    createWebBus, JDBus,
} from "jacdac-ts";

let bus: JDBus;

export let initBus = (): JDBus => {
    initBus = () => { throw "multiple initialization" };
    bus = createWebBus();
    return bus;
}
