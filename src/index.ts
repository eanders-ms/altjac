import { CHANGE, snapshotSensors } from "jacdac-ts";
import "milligram";
import { initBus } from "./bus";

const connectEl = document.getElementById("connectbtn") as HTMLButtonElement;
const logEl = document.getElementById("log") as HTMLPreElement;
const log = (msg: any) => {
  console.log(msg);
  logEl.innerText += msg + "\n";
};

const bus = initBus();

connectEl.onclick = async () =>
  bus.connected ? bus.disconnect() : bus.connect();

// we're ready
log("click connect to start");

bus.on(CHANGE, () => {
  const services = bus.services();
  const devices = bus.devices();

  log(`services ${services.length}`);
  services.forEach(service => log(`--${service.friendlyName}`));
  log(`devices ${devices.length}`);
  devices.forEach(device => log(`--${device.friendlyName}`));

});
