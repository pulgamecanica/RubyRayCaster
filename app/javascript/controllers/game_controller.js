import { Controller } from "@hotwired/stimulus"
import { select } from "d3"
import { GameWindow } from "../raycasting"
import consumer from "channels/consumer"

const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 600;
let gameWindow = null;
let gameData = null;

export default class extends Controller {
  static values = {
    map: String,
    width: Number,
    gameId: Number
  }

  connect() {
    consumer.subscriptions.create({ channel: "GameChannel", id: this.gameIdValue }, {
      initialized(){
        this.update = this.update.bind(this)
      },

      connected() {
        console.log("Connected");
        this.update();
        // Called when the subscription is ready for use on the server
      },

      disconnected() {
        console.log("Disconnected");
        // Called when the subscription has been terminated by the server
      },

      received(data) {
        console.log("Recieved data", data);
        // Called when there's incoming data on the websocket for this channel
      },

      update: function() {
        console.log("Update");
        return this.perform('update');
      },

      user_input: function() {
        return this.perform('user_input');
      }
    });
    console.log("Action Cable Connected", "Game:", this.gameIdValue);
  }

  load_game() {
    if (gameWindow) {
      gameWindow.start();
      return ;
    }
    let map = this.mapValue;
    let width = this.widthValue;
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
    gameWindow = new GameWindow(canvas.node(), map, width);
    gameWindow.start();

    // REMOVE LOADER
    // this.load_game();
  }
}
