import { snapshotSensors, startDevTools, JoystickButtons } from "jacdac-ts";
import { initBus } from "./bus";

const debugEl = document.getElementById("debugbtn") as HTMLButtonElement;
const connectDeviceEl = document.getElementById("connectbtn") as HTMLButtonElement;
const wsAddressEl = document.getElementById("wsAddress") as HTMLInputElement;
const wsConnectEl = document.getElementById("wsConnect") as HTMLButtonElement;
const wsStatusEl = document.getElementById("wsStatus") as HTMLElement;
const modelSelectEl = document.getElementById("modelField") as HTMLSelectElement;

const state = {
  bus: initBus(),
  wsIsOpen: false,
  model: "model-joy-and-btn"
};

let ws: WebSocket = null;

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
    state.bus.connected ? state.bus.disconnect() : state.bus.connect();
  }
}

wsConnectEl.onclick = (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  state.wsIsOpen ? ws.close() : altspaceConnect(wsAddressEl.value);
}

modelSelectEl.onchange = (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  state.model = ev.target["value"];
  sendModel();
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
  const snap = snapshotSensors(state.bus);
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
    if (state.wsIsOpen) {
      sendState();
    }
  }
  window.requestAnimationFrame(step);
}
window.requestAnimationFrame(step);

function setSocketStatus(msg: string) {
  wsStatusEl.innerText = msg;
}

function sendState() {
  send({
    type: 'input',
    input
  });
}

function sendModel() {
  send({
    type: 'model',
    model: state.model
  });
}

function send(msg: any) {
  if (state.wsIsOpen) {
    try {
      ws.send(JSON.stringify(msg));
    }
    catch {
      ws.close();
      ws = null;
    }
  }
}

function altspaceConnect(address: string) {
  if (ws) {
    try { ws.close(); } catch { }
  }
  try {
    setSocketStatus("Connecting...");
    ws = new WebSocket(address + '/jacdac');
    ws.onclose = (ev) => {
      setSocketStatus("Disconnected");
      wsConnectEl.textContent = "Connect";
      state.wsIsOpen = false;
    };
    ws.onerror = (ev) => {
      setSocketStatus("Error");
      wsConnectEl.textContent = "Connect";
      state.wsIsOpen = false;
    };
    ws.onopen = (ev) => {
      setSocketStatus("Connected");
      wsConnectEl.textContent = "Disconnect";
      state.wsIsOpen = true;
      sendModel();
    };
  } catch (e) {
    setSocketStatus("Disconnected");
  }
}
