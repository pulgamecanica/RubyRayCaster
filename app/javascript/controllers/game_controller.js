import { Controller } from "@hotwired/stimulus"
import { select } from "d3"
import { GameWindow } from "../raycasting"
import { drawSvgMap } from "./map-viewer_controller"
import consumer from "channels/consumer"

const CANVAS_WIDTH = 850;
const CANVAS_HEIGHT = 600;
let gameWindow =  null;
export let gameData = null;

export default class extends Controller {
  static values = {
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
        gameData = null;
        // Called when the subscription has been terminated by the server
      },

      received(data) {
        gameData = data;
        if (gameWindow) {
          console.log("Update", data);
          gameWindow.init();
        }
        drawSvgMap(select("#map-viewer-svg"), gameData["game"]["map_terrain"], gameData["game"]["map_width"]);
      },

      update: function() {
        return this.perform('update');
      },

      user_input: function() {
        return this.perform('user_input');
      }
    });
    console.log("Action Cable Connected", "Game:", this.gameIdValue);
  }

  load_game() {
    if (!gameData) {
      alert("Not Ready, wait a few seconds");
      return;
    }
    if (gameWindow) {
      gameWindow.init();
      return ;
    }
    let canvas_container = select("#canvas_container");

    canvas_container.selectAll("canvas").remove();
    canvas_container.attr("style", "display: inline-block");
    let canvas = canvas_container.append("canvas")
      .attr("style", "background: lightgray")
      .attr("width", CANVAS_WIDTH)
      .attr("height", CANVAS_HEIGHT);

    gameWindow = new GameWindow(canvas.node(), CANVAS_WIDTH);
    gameWindow.init();
  }
}
