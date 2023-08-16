import { Controller } from "@hotwired/stimulus"
import { select, scaleLinear, scaleOrdinal, extent, schemePastel2, pointer } from "d3"

const SVG_WIDTH = 600;
const SVG_HEIGHT = 300;

function GameEditor(svg, map_chars_width, map_chars_height) {
  this.map_chars_width = map_chars_width;
  this.map_chars_height = map_chars_height;
  this.map_width = SVG_WIDTH - 20;
  this.map_height = SVG_HEIGHT - 20;
  this.svg = svg;
  this.pointer_cords;
  this.editables = [];
  this.tile_size = {x: this.map_width / map_chars_width, y: this.map_height / map_chars_height};
}

GameEditor.prototype = {
  changeGameSize: function(new_width, new_height = this.map_chars_height) {
    this.map_chars_width = +new_width;
    this.map_chars_height = +new_height;
    this.tile_size = {x: this.map_width / this.map_chars_width, y: this.map_height / this.map_chars_height};
  },

  isCellEditable: function(i) {
    return (this.editables.includes(i));
  },

  toggleCellEditable: function(i) {
    if (this.isCellEditable(i)) {
      this.editables.splice(this.editables.indexOf(i), 1);
    } else {
      this.editables.push(i);
    }
  },

  removeEditables: function() {
    this.editables.splice(0, this.editables.length);
  },

  init: function() {
    this.svg.attr( "width", SVG_WIDTH )
      .attr( "height", SVG_HEIGHT )
      .attr( "style", "background-color: lemonchiffon;" )
      .attr( "cursor", "crosshair" );
    // Enable tabIndex to take key bindings
    this.pointer_cords = {i: -1};
    this.svg.node().tabIndex = 1;
  },
} 

const updateHeight = (height) => {
  select("#mapHeight").selectAll( "p").data( [height] ).enter().append( "p" ).text( "Height: " + Math.floor(height) );
}

export default class extends Controller {
  static targets = [ "inputMap", "inputWidth" ]

  update() {
    this.editor.svg.selectAll( "g" ).remove();
    this.drawMap();
    updateHeight(this.editor.map_chars_height);
  }

  getMapData() {
    return this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      return {
        key: d,
        selected: this.editor.pointer_cords && i == this.editor.pointer_cords.i,
        editable: this.editor.isCellEditable(i)
      }
    });
  }

  getHeight() {
     return this.inputMapTarget.value.replace(/\s+/g, '').length / this.inputWidthTarget.value;
  }

  poiterMoveUpdate(event) {
    let pt = pointer( event );
    this.editor.pointer_cords = {
      i: (Math.floor(pt[1] / this.editor.tile_size.y) * this.inputWidthTarget.value) + Math.floor(pt[0] / this.editor.tile_size.x)
    }
    this.update();
  }

  toggleCell() {
    let elem = this.inputMapTarget.value.replace(/\s+/g, '').split("")[this.editor.pointer_cords.i];
    this.editor.toggleCellEditable(this.editor.pointer_cords.i);
    this.update();
  }

  updateEditables(event) {
    if (!event) return;
    if (event.key.toLowerCase() === "escape") {
      this.editor.removeEditables();
    }
    if (event.key.length != 1) return;
    let str = this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      if (this.editor.isCellEditable(i)) {
        return (event.key);
      }
      return (d);
    }).join("");
    this.inputMapTarget.value = str;
    this.editor.removeEditables();
    this.update();
  }

  drawMap() {
    let width = this.inputWidthTarget.value;
    let data = this.getMapData();
    let scX = scaleLinear().domain([0, width]).range([0, this.editor.map_width]);
    let scY = scaleLinear().domain([0, this.editor.map_chars_height - 1]).range([0, this.editor.map_height - this.editor.tile_size.y]);
    let scColor = scaleOrdinal( schemePastel2 ).domain( extent( data ) );
    let tiles = this.editor.svg.selectAll( "g" )
      .data( data )
      .enter()
      .append( "g" )
      .attr( "class", (d) => d.editable ? "editable" : "" );

    let middleX = this.editor.tile_size.x / 2;
    let middleY = this.editor.tile_size.y / 2;
    let textSize = 1.25;
    if (middleX < middleY) {
      textSize *= middleX;
    } else {
      textSize *= middleY;
    }

    tiles.append( "rect" )
      .attr( "stroke", "gray" ).attr( "fill", d => {
        if (d.editable && d.selected) {
          return ("#f5e79e");
        } else if (d.editable) {
          return "lemonchiffon";
        } else if (d.selected) {
          return "orange";
        } else { 
          return (scColor(d.key));
        }
      })
      .attr( "x", (d, i) => { return scX(i % width) } )
      .attr( "y", (d, i) => { return scY(Math.floor(i / width)) } )
      .attr( "width", this.editor.tile_size.x )
      .attr( "height", this.editor.tile_size.y );

    tiles.append( "text" )
      .text( d => d.key )
      .attr( "x", (d, i) => { return scX(i % width) + middleX - (textSize / 4) } )
      .attr( "y", (d, i) => { return scY(Math.floor(i / width)) + middleY + (textSize / 2) } )
      .attr( "style", "font-size: " + textSize + "px; font-family: 'Comic Sans MS', 'Papyrus', sans-serif;")
  }

  connect() {
    console.log("Connected");
    this.editor = new GameEditor(select("#mapEditor").append( "svg" ).attr( "id", "svgMapEditor" ), this.inputWidthTarget.value, this.getHeight() );
    // Initialize the Game Editor
    this.editor.init();
    // Initialize the pointer hook
    // Should be done on init() function
    // I couldn't find a way because I need to use pointerUpdate
    this.editor.svg.on( "mousemove", (event) => {
        this.poiterMoveUpdate(event);
      });
    this.update();
  }

  removeColumn(event) {
    event.preventDefault();
    if (this.inputWidthTarget.value <= 1) return;
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      if ((i % this.inputWidthTarget.value) == this.inputWidthTarget.value - 1) {
        return ("");
      }
      return (d);
    }).join("");
    this.inputWidthTarget.value = +this.inputWidthTarget.value - 1;
    this.editor.changeGameSize(this.editor.map_chars_width - 1);
    this.update();
  }

  removeRow(event) {
    event.preventDefault();
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').substr(0, this.inputMapTarget.value.length - this.inputWidthTarget.value)
    this.editor.changeGameSize(this.editor.map_chars_width, this.editor.map_chars_height - 1);
    select("#mapHeight").selectAll( "p").remove();
    this.update();
  }

  addColumn(event) {
    event.preventDefault();
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      if ((i % +this.inputWidthTarget.value) == this.inputWidthTarget.value - 1) {
        return (d + "W");
      }
      return (d);
    }).join("");  
    this.inputWidthTarget.value = +this.inputWidthTarget.value + 1;
    this.editor.changeGameSize(+this.editor.map_chars_width + 1);
    this.update();
  }

  addRow(event) {
    event.preventDefault();
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '') + "W".repeat(+this.inputWidthTarget.value);
    this.editor.changeGameSize(this.editor.map_chars_width, this.editor.map_chars_height + 1);
    select("#mapHeight").selectAll( "p").remove();
    this.update();
  }


  onTextChange() {
    console.log("New Text", this.inputWidthTarget.value, this.inputMapTarget.value);
    // this.inputTextTarget.value = "############################################";
  }

  onWidthIncrease() {
    console.log("Increase");
  }

  onWidthDecrease() {
    console.log("Decrease");
  }
}
