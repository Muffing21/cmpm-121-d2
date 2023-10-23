import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

//due to magic numbers...
const zero = 0;
const one = 1;
let currentSticker: string | null = null;

class CursorCommand {
  x: number;
  y: number;
  cursorFontSize: number;
  cursorSticker: string;
  constructor(
    x: number,
    y: number,
    cursorFontSize: number,
    cursorSticker: string,
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
      this.y + (one + one) * (one + one) * (one + one) * (one + one),
    );
  }
}

interface DrawingCommand {
  execute(ctx: CanvasRenderingContext2D): void;
}

class Sticker implements DrawingCommand {
  points: CursorCommand[];
  cursorSticker: string;
  x: number;
  y: number;
  constructor(x: number, y: number, cursorSticker: string) {
    this.cursorSticker = cursorSticker;
    this.points = [new CursorCommand(x, y, cursorSize, this.cursorSticker)];
    this.x = x;
    this.y = y;
  }
  execute(ctx: CanvasRenderingContext2D) {
    // ctx.save();
    ctx.fillText(this.cursorSticker, this.x, this.y);
    // ctx.restore();
  }
}

class LineCommand implements DrawingCommand {
  points: CursorCommand[];
  thickness: number;
  cursorSticker: string;
  constructor(x: number, y: number, thickness: number, cursorSticker: string) {
    this.points = [new CursorCommand(x, y, thickness, cursorSticker)];
    this.thickness = thickness;
    this.cursorSticker = cursorSticker;
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

const commands: DrawingCommand[] = [];
const redoCommands: DrawingCommand[] = [];

let lineWidth = 4;
let cursorSize = 32;

let cursorCommand: CursorCommand | null = null;

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

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
      currentSticker,
    );
  }
  notify("tool-moved");

  if (e.buttons == one) {
    cursorCommand = null;
    if (currentSticker == "*") {
      currentLineCommand?.points.push(
        new CursorCommand(e.offsetX, e.offsetY, cursorSize, currentSticker),
      );
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (currentSticker) {
    if (currentSticker != "*") {
      commands.push(new Sticker(e.offsetX, e.offsetY, currentSticker));
    }
    currentLineCommand = null;
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      currentSticker,
    );
    notify("drawing-changed");
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
  if (currentSticker == "*") {
    cursorCommand = new CursorCommand(
      e.offsetX,
      e.offsetY,
      cursorSize,
      currentSticker,
    );
  }
  notify("tool-moved");
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
    currentSticker = "*";
    lineWidth = one + one;
    cursorSize = lineWidth * (one + one + one + one + one + one);
  } else if (button.buttonText == "thick") {
    currentSticker = "*";
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  } else if (button.buttonText == "💀") {
    currentSticker = "💀";
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  } else if (button.buttonText == "🎃") {
    currentSticker = "🎃";
    lineWidth = (one + one) * (one + one) * (one + one);
    cursorSize = lineWidth * (one + one + one + one);
  } else if (button.buttonText == "👻") {
    currentSticker = "👻";
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
