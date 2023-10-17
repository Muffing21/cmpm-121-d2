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

// interface Draw {
//   active: boolean;
//   x: number;
//   y: number;
// }

// const drawInfo: Draw = {
//   active: false,
//   x: 0,
//   y: 0,
// };

let active = false;

let x = 0;
let y = 0;
const origin = 0;

canvas.addEventListener("mousedown", (e) => {
  active = true;
  x = e.offsetX;
  y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (active) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    x = e.offsetX;
    y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  active = false;
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(origin, origin, canvas.width, canvas.height);
});
