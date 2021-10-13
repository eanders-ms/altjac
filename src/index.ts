import "milligram";
import {
    createWebBus,
  } from "jacdac-ts";
  
const connectEl = document.getElementById("connectbtn") as HTMLButtonElement;
const logEl = document.getElementById("log") as HTMLPreElement;
const log = (msg: any) => {
  console.log(msg);
  logEl.innerText += msg + "\n";
};
// create WebUSB bus
const bus = createWebBus();

connectEl.onclick = async () =>
  bus.connected ? bus.disconnect() : bus.connect();

// we're ready
log("click connect to start");
