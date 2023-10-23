import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

//due to magic numbers...
const zero = 0;
const one = 1;

class CursorCommand {
  x: number;
  y: number;
  cursorSize?: number;
  sticker?: string;
  constructor(x: number, y: number, cursorSize?: number, sticker?: string) {
    this.x = x;
    this.y = y;
    this.cursorSize = cursorSize;
    this.sticker = sticker;
  }
  execute() {
    ctx.font = `${this.cursorSize}px monospace`;
    ctx.fillText(
      "*",
      this.x - (one + one) * (one + one) * (one + one),
      this.y + (one + one) * (one + one) * (one + one) * (one + one),
    );
  }
  stickerPreview() {
    if (this.sticker) {
      // ctx.font = `${this.cursorSize}px monospace`;
      ctx.fillText(this.sticker, this.x, this.y);
    }
  }
}

class LineCommand {
  points: CursorCommand[];
  thickness: number;
  sticker?: string;
  x: number;
  y: number;
  constructor(x: number, y: number, thickness: number, sticker?: string) {
    this.points = [new CursorCommand(x, y, cursorSize)];
    this.thickness = thickness;
    this.sticker = sticker;
    this.x = x;
    this.y = y;
  }
  execute(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    const { x, y } = this.points[zero];
    ctx.moveTo(x, y);
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  grow(x: number, y: number) {
    this.points.push(new CursorCommand(x, y, this.thickness));
  }
  placeSticker(ctx: CanvasRenderingContext2D) {
    if (this.sticker) {
      ctx.fillText(this.sticker, this.x, this.y);
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      const { x, y } = this.points[zero];
      ctx.moveTo(x, y);
      for (const { x, y } of this.points) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
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
  {
    button: document.createElement("button"),
    buttonText: "💀",
  },
  {
    button: document.createElement("button"),
    buttonText: "🎃",
  },
  {
    button: document.createElement("button"),
    buttonText: "👻",
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
const stickerCommands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let lineWidth = 4;
let cursorSize = 32;
let currentSticker: string | null = null;

let cursorCommand: CursorCommand | null = null;

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);
bus.addEventListener("tool-moved", stickerDraw);

let currentLineCommand: LineCommand | null = null;

//https://shoddy-paint.glitch.me/paint0.html
canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentSticker) {
    currentLineCommand = new LineCommand(
      e.offsetX,
      e.offsetY,
      lineWidth,
      currentSticker,
    );
    stickerCommands.push(currentLineCommand);
    redoCommands.splice(zero, redoCommands.length);
    notify("tool-moved");
  } else {
    currentLineCommand = new LineCommand(
      e.offsetX,
      e.offsetY,
      lineWidth,
      undefined,
    );
    commands.push(currentLineCommand);
    redoCommands.splice(zero, redoCommands.length);
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (currentSticker) {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      undefined,
      currentSticker,
    );
    notify("tool-moved");
  } else {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      undefined,
    );
    notify("tool-moved");
  }

  if (e.buttons == one) {
    cursorCommand = null;
    currentLineCommand?.points.push(
      new CursorCommand(e.offsetX, e.offsetY, cursorSize),
    );
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", (e) => {
  currentLineCommand = null;
  if (currentSticker) {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      undefined,
      currentSticker,
    );
    notify("tool-moved");
  } else {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      undefined,
    );
    notify("cursor-changed");
  }
});

for (const tool of tools) {
  tool.button.addEventListener("click", () => {
    eventListener(tool);
  });
}

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentSticker) {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      undefined,
      currentSticker,
    );
    notify("tool-moved");
  } else {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY, cursorSize);
    notify("cursor-changed");
  }
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
    currentSticker = null;
    lineWidth = one + one;
    cursorSize = lineWidth * (one + one + one + one + one + one);
  } else if (button.buttonText == "thick") {
    currentSticker = null;
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  }
  //code for stickers here
  else if (
    button.buttonText == "💀" ||
    button.buttonText == "🎃" ||
    button.buttonText == "👻"
  ) {
    currentSticker = button.buttonText;
    console.log(currentSticker);
    // notify("tool-moved");
  }
}

function redraw() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.execute(ctx));

  if (cursorCommand) {
    cursorCommand.execute();
  }
}

function stickerDraw() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);

  stickerCommands.forEach((cmd) => cmd.placeSticker(ctx));

  if (cursorCommand) {
    cursorCommand.stickerPreview();
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
