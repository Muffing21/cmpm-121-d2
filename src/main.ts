import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

//due to magic numbers...
const zero = 0;
const one = 1;

class CursorCommand {
  x: number;
  y: number;
  cursorSize: number;
  constructor(x: number, y: number, cursorSize: number) {
    this.x = x;
    this.y = y;
    this.cursorSize = cursorSize;
  }
  execute() {
    ctx.font = `${this.cursorSize}px monospace`;
    ctx.fillText(
      "*",
      this.x - (one + one) * (one + one) * (one + one),
      this.y + (one + one) * (one + one) * (one + one) * (one + one)
    );
  }
}

class LineCommand {
  points: CursorCommand[];
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.points = [new CursorCommand(x, y, cursorSize)];
    this.thickness = thickness;
  }
  execute(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    const { x, y } = this.points[zero];
    ctx.moveTo(x, y);
    for (const { x, y } of this.points) {
      const k = 2;
      ctx.lineTo(x + Math.random() * k, y + Math.random() * k);
    }
    ctx.stroke();
  }
  grow(x: number, y: number) {
    this.points.push(new CursorCommand(x, y, this.thickness));
  }
}

//refactor attempt?
interface Buttons {
  button: HTMLButtonElement;
  buttonText: string;
}

const tools: Buttons[] = [
  {
    button: document.createElement("button"),
    buttonText: "clear",
  },
  {
    button: document.createElement("button"),
    buttonText: "undo",
  },
  {
    button: document.createElement("button"),
    buttonText: "redo",
  },
  {
    button: document.createElement("button"),
    buttonText: "thin",
  },
  {
    button: document.createElement("button"),
    buttonText: "thick",
  },
];

createButtons(tools); //create all the clickable buttons

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
const ctx = canvas.getContext("2d")!;
app.append(canvas);

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let lineWidth = 4;
let cursorSize = 32;

let cursorCommand: CursorCommand | null = null;

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);

// function tick() {
//   redraw();
//   requestAnimationFrame(tick);
// }
// tick();

let currentLineCommand: LineCommand | null = null;

//https://shoddy-paint.glitch.me/paint0.html
canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY, lineWidth);
  commands.push(currentLineCommand);
  redoCommands.splice(zero, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY, cursorSize);
  notify("cursor-changed");

  if (e.buttons == one) {
    cursorCommand = null;
    currentLineCommand?.points.push(
      new CursorCommand(e.offsetX, e.offsetY, cursorSize)
    );
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", (e) => {
  currentLineCommand = null;
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY, cursorSize);
  notify("drawing-changed");
});

for (const tool of tools) {
  tool.button.addEventListener("click", () => {
    eventListener(tool);
  });
}

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY, cursorSize);
  notify("cursor-changed");
});

//refactor attempt for clickable buttons
function eventListener(button: Buttons) {
  if (button.buttonText == "clear") {
    commands.splice(zero, commands.length);
    notify("drawing-changed");
  } else if (button.buttonText == "undo") {
    const lastAction = commands.pop();
    if (lastAction) {
      redoCommands.push(lastAction);
      notify("drawing-changed");
    }
  } else if (button.buttonText == "redo") {
    const lastAction = redoCommands.pop();
    if (lastAction) {
      commands.push(lastAction);
      notify("drawing-changed");
    }
  } else if (button.buttonText == "thin") {
    lineWidth = one + one;
    cursorSize = lineWidth * (one + one + one + one + one + one);
  } else if (button.buttonText == "thick") {
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  }
}

function redraw() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.execute(ctx));

  if (cursorCommand) {
    cursorCommand.execute();
  }
}

function createButtons(buttons: Buttons[]) {
  for (const butt of buttons) {
    butt.button.textContent = butt.buttonText;
    app.append(butt.button);
  }
  const header = document.createElement("h1");
  header.innerHTML = "Harry's Game";

  const appTitle: HTMLElement = document.createElement("h1");
  appTitle.innerHTML = "Draw";
  app.append(header);
  app.append(appTitle);
}
