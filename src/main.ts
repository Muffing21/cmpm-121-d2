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

canvas.height = 256;
canvas.width = 256;

app.append(canvas);
app.append(header);
app.append(appTitle);
app.append(clearButton);

const ctx = canvas.getContext("2d")!;

class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

let lines: Point[][] = [];
let currentLine: Point[] | null = null;
const zero = 0;
const one = 1;
const cursor = { active: false, x: 0, y: 0 };

const drawingEvent = new Event("drawing-changed");

//https://shoddy-paint.glitch.me/paint0.html
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  console.log(cursor.x);

  currentLine = [];
  lines.push(currentLine);
  const pointObj = new Point(cursor.x, cursor.y);
  currentLine.push(pointObj);

  canvas.dispatchEvent(drawingEvent);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    const pointObj = new Point(cursor.x, cursor.y);
    currentLine!.push(pointObj);
    canvas.dispatchEvent(drawingEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);
  lines = [];
});

function redraw() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > one) {
      ctx.beginPath();
      const { x, y } = line[zero];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
