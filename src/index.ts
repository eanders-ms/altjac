import { snapshotSensors, startDevTools, JoystickButtons } from "jacdac-ts";
import { initBus } from "./bus";

const debugEl = document.getElementById("debugbtn") as HTMLButtonElement;
const connectDeviceEl = document.getElementById("connectbtn") as HTMLButtonElement;
const wsAddressEl = document.getElementById("wsAddress") as HTMLInputElement;
const wsConnectEl = document.getElementById("wsConnect") as HTMLButtonElement;
const wsStatusEl = document.getElementById("wsStatus") as HTMLElement;

const bus = initBus();
let ws: WebSocket;
let wsIsOpen = false;

if (window.location.ancestorOrigins.length) {
  debugEl.remove();
  connectDeviceEl.remove();
} else {
  debugEl.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!window.location.ancestorOrigins.length) {
      startDevTools();
    }
  }
  connectDeviceEl.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    bus.connected ? bus.disconnect() : bus.connect();
  }
}

wsConnectEl.onclick = (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  altspaceConnect(wsAddressEl.value);
}

type Button = {
  down: boolean;
  pressed: boolean;
  released: boolean;
};

type Stick = {
  x: number;
  y: number;
};

type Input = {
  button: Button;
  stick: Stick;
};

const input: Input = {
  button: {
    down: false,
    pressed: false,
    released: false
  },
  stick: {
    x: 0,
    y: 0
  }
};


function step() {
  const snap = snapshotSensors(bus);
  //const str = JSON.stringify(snap);
  //console.log(str);
  const joysticks = snap.joystick;
  if (joysticks.length) {
    const joystick = joysticks[0];
    const buttons = Number(joystick["buttons"]);
    // Update button state
    input.button.pressed = false;
    input.button.released = false;
    if (buttons & JoystickButtons.A) {
      input.button.pressed = !input.button.down;
      input.button.down = true;
    } else {
      input.button.released = input.button.down;
      input.button.down = false;
    }
    // Update stick state
    input.stick.x = Number(joystick["x"]) || 0;
    input.stick.y = Number(joystick["y"]) || 0;
    //console.log(JSON.stringify(input));
    if (wsIsOpen) {
      const msg = {
        type: 'input',
        state: input
      };
      try {
        ws.send(JSON.stringify(msg));
      }
      catch {
        ws.close();
        ws = null;
      }
    }
  }
  window.requestAnimationFrame(step);
}
window.requestAnimationFrame(step);

function setSocketStatus(msg: string) {
  wsStatusEl.innerText = msg;
}

function altspaceConnect(address: string) {
  if (ws) {
    try { ws.close(); } catch { }
  }
  setSocketStatus("Connecting...");
  ws = new WebSocket(address);
  ws.onclose = (ev) => {
    setSocketStatus("Disconnected");
    wsIsOpen = false;
  };
  ws.onerror = (ev) => {
    setSocketStatus("Error");
    wsIsOpen = false;
  };
  ws.onopen = (ev) => {
    setSocketStatus("Connected");
    wsIsOpen = true;
  };
}
