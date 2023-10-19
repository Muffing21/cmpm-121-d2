import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Harry's Game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;

const appTitle: HTMLElement = document.createElement("h1");
appTitle.innerHTML = "Draw";

const canvas: HTMLCanvasElement = document.createElement("canvas");

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";

canvas.height = 256;
canvas.width = 256;

app.append(canvas);
app.append(header);
app.append(appTitle);
app.append(clearButton);
app.append(undoButton);
app.append(redoButton);
// app.append(thinButton);
// app.append(thickButton);

const ctx = canvas.getContext("2d")!;

class CursorCommand {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  execute() {
    ctx.font = "32px monospace";
    // ctx.fillText("*", this.x - 8, this.y + 16);
  }
}

class LineCommand {
  points: CursorCommand[];
  // thickness: number;
  constructor(x: number, y: number) {
    this.points = [new CursorCommand(x, y)];
    // this.thickness = thickness;
  }
  execute(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "black";
    // ctx.lineWidth = this.thickness;
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
    this.points.push(new CursorCommand(x, y));
  }
}

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let cursorCommand: CursorCommand | null = null;

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("drawing-changed", redraw);

// function tick() {
//   redraw();
//   requestAnimationFrame(tick);
// }
// tick();

let currentLineCommand: LineCommand | null = null;
const zero = 0;
const one = 1;

//https://shoddy-paint.glitch.me/paint0.html
canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);
  redoCommands.splice(zero, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("cursor-changed");

  if (e.buttons == one) {
    currentLineCommand?.points.push(new CursorCommand(e.offsetX, e.offsetY));
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

clearButton.addEventListener("click", () => {
  commands.splice(zero, commands.length);
  notify("drawing-changed");
});

undoButton.addEventListener("click", () => {
  const lastAction = commands.pop();
  if (lastAction) {
    redoCommands.push(lastAction);
    notify("drawing-changed");
  }
});

redoButton.addEventListener("click", () => {
  const lastAction = redoCommands.pop();
  if (lastAction) {
    commands.push(lastAction);
    notify("drawing-changed");
  }
});

function redraw() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.execute(ctx));

  if (cursorCommand) {
    cursorCommand.execute();
  }
}
