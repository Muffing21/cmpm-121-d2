import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

//due to magic numbers...
const zero = 0;
const one = 1;
const four = 4;
let currentSticker: string | null = null;
const stickerButton: HTMLButtonElement[] = [];

class CursorCommand {
  x: number;
  y: number;
  cursorFontSize: number;
  cursorSticker: string;
  constructor(
    x: number,
    y: number,
    cursorFontSize: number,
    cursorSticker: string
  ) {
    this.x = x;
    this.y = y;
    this.cursorFontSize = cursorFontSize;
    this.cursorSticker = cursorSticker;
  }
  execute() {
    ctx.font = `${this.cursorFontSize}px monospace`;

    ctx.fillText(
      `${this.cursorSticker}`,
      this.x - (one + one) * (one + one) * (one + one),
      this.y + (one + one) * (one + one) * (one + one) * (one + one)
    );
  }
}

interface DrawingCommand {
  execute(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

class Sticker implements DrawingCommand {
  cursorSticker: string;
  x: number;
  y: number;
  constructor(x: number, y: number, cursorSticker: string) {
    this.cursorSticker = cursorSticker;
    this.x = x;
    this.y = y;
  }
  execute(ctx: CanvasRenderingContext2D) {
    // ctx.save();
    ctx.fillText(this.cursorSticker, this.x, this.y);
    // ctx.restore();
  }
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class LineCommand implements DrawingCommand {
  points: { x: number; y: number }[];
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    //remove sticker, also just hold x and y rather than a point
    this.points = [{ x, y }];
    this.thickness = thickness;
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
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

//probably better to use enum
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

const exportButton = document.createElement("button");
exportButton.innerHTML = "export";
app.append(exportButton);

const stickers: string[] = ["💀", "🎃", "👻", "custom sticker"];

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
const ctx = canvas.getContext("2d")!;
app.append(canvas);

createButtons(tools); //create all the clickable non-sticker buttons

for (const sticker of stickers) {
  createStickerButtons(sticker);
}

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

const commands: DrawingCommand[] = [];
const redoCommands: DrawingCommand[] = [];
let currentStickerCommand: Sticker | null = null;

let lineWidth = 4;
let cursorSize = 32;

let cursorCommand: CursorCommand | null = null;

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

let currentLineCommand: LineCommand | null = null;

for (const tool of tools) {
  tool.button.addEventListener("click", () => {
    eventListenerButton(tool);
  });
}
for (const stickerbutton of stickerButton) {
  listenCustomSticker(stickerbutton);
}

exportButton.addEventListener("click", exportListener);

//https://shoddy-paint.glitch.me/paint0.html
canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentSticker && currentSticker != "*") {
    currentStickerCommand = new Sticker(e.offsetX, e.offsetY, currentSticker);
    commands.push(currentStickerCommand);
    redoCommands.splice(zero, redoCommands.length);
    notify("drawing-changed");
  } else if (currentSticker == "*") {
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY, lineWidth);
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
      cursorSize,
      currentSticker
    );
  }
  notify("tool-moved");

  if (e.buttons == one) {
    cursorCommand = null;
    if (currentSticker == "*") {
      currentLineCommand?.drag(e.offsetX, e.offsetY);
    } else if (currentSticker != "*") {
      currentStickerCommand?.drag(e.offsetX, e.offsetY);
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (currentSticker) {
    currentLineCommand = null;
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      currentSticker
    );
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentSticker == "*") {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      currentSticker
    );
  }
  notify("tool-moved");
});

//refactor attempt for clickable buttons
function eventListenerButton(button: Buttons) {
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
    currentSticker = "*";
    lineWidth = one + one;
    cursorSize = lineWidth * (one + one + one + one + one + one);
  } else if (button.buttonText == "thick") {
    currentSticker = "*";
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  }
}

function eventListenerSticker(str: string) {
  currentSticker = str;

  if (str == "custom sticker") {
    const userInput = window.prompt("Type something for your custom sticker:");
    if (userInput && userInput != "") {
      currentSticker = userInput;
      stickers.push(userInput);
      createStickerButtons(userInput);
      const latestSticker = stickerButton[stickerButton.length - one];
      listenCustomSticker(latestSticker);
    }
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

function createStickerButtons(str: string) {
  const temp: HTMLButtonElement = document.createElement("button");
  temp.innerHTML = str;
  stickerButton.push(temp);
  app.append(temp);
}

function listenCustomSticker(stickerbutton: HTMLButtonElement) {
  stickerbutton.addEventListener("click", () => {
    eventListenerSticker(stickerbutton.innerHTML);
  });
}

function exportListener() {
  const canvasExport: HTMLCanvasElement = document.createElement("canvas");
  canvasExport.height = 1024;
  canvasExport.width = 1024;
  const ctxExport = canvasExport.getContext("2d")!;
  commands.forEach((cmd) => cmd.execute(ctxExport));
  ctxExport.scale(four, four);
  const anchor = document.createElement("a");
  anchor.href = canvasExport.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
}
