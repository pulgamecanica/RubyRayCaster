import { Controller } from "@hotwired/stimulus"
import { select } from "d3"
import { GameWindow } from "../raycasting"

const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 300;
let gameWindow = null;

export default class extends Controller {

  connect() {
    console.log("Controller connected");
  }

  load_game() {
    if (gameWindow)
      return
    let canvas_container = select("#canvas_container");

    canvas_container.selectAll("canvas").remove();
    canvas_container.attr("style", "display: inline-block");
    let canvas = canvas_container.append("canvas")
      .attr("style", "background: lightgray")
      .attr("width", CANVAS_WIDTH)
      .attr("height", CANVAS_HEIGHT);

    // rayCastingEngine.canvas = canvas.node();
    // rayCastingEngine.canvasContext = rayCastingEngine.canvas.getContext('2d');
    // rayCastingEngine.canvasPixels =  rayCastingEngine.canvasContext.getImageData(0, 0, rayCastingEngine.canvas.width, rayCastingEngine.canvas.height);
    gameWindow = new GameWindow(canvas.node());
    gameWindow.start();

    // REMOVE LOADER
    // this.load_game();
  }
}
