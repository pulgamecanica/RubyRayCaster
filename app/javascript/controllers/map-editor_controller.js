import { Controller } from "@hotwired/stimulus"
import { select, scaleLinear, scaleOrdinal, extent, schemePastel2, pointer, drag } from "d3"

const SVG_WIDTH = 600;
const SVG_HEIGHT = 300;

function GameEditor(svg, mapCharsWidth, mapCharsHeight) {
  this.mapCharsWidth = mapCharsWidth;
  this.mapCharsHeight = mapCharsHeight;
  this.mapWidth = SVG_WIDTH;
  this.mapHeight = SVG_HEIGHT;
  this.svg = svg;
  this.pointerCords;
  this.editables = [];
  this.tileSize = {x: this.mapWidth / mapCharsWidth, y: this.mapHeight / mapCharsHeight};
  this.rectSelection = {x: 0, y: 0, width: 0, height: 0};
}

GameEditor.prototype = {
  changeGameSize: function(new_width, new_height = this.mapCharsHeight) {
    this.mapCharsWidth = +new_width;
    this.mapCharsHeight = +new_height;
    this.tileSize = {x: this.mapWidth / this.mapCharsWidth, y: this.mapHeight / this.mapCharsHeight};
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

  indexToCoords : function(index) {
    return ({x: Math.floor(index % +this.mapCharsWidth), y: Math.floor(index / +this.mapCharsWidth)});
  },

  updateSelectedTiles: function() {
    let rectTopLeftCorner = {
      x: Math.floor(this.rectSelection.x / this.tileSize.x),
      y: Math.floor(this.rectSelection.y / this.tileSize.y)
    };
    let rectBottomDownCorner = {
      x: Math.floor((this.rectSelection.x + this.rectSelection.width) / this.tileSize.x),
      y: Math.floor((this.rectSelection.y + this.rectSelection.height) / this.tileSize.y)
    };
    for (let i = 0; i < +this.mapCharsWidth * +this.mapCharsHeight; i++) {
      let tileCords = this.indexToCoords(i);
      // Check if the rectangle passes throguth this coordinate
      if (tileCords.x >= rectTopLeftCorner.x && tileCords.x <= rectBottomDownCorner.x &&
          tileCords.y >= rectTopLeftCorner.y && tileCords.y <= rectBottomDownCorner.y)
        this.toggleCellEditable(i);
    }
  },

  init: function() {
    this.svg.attr( "width", SVG_WIDTH )
      .attr( "height", SVG_HEIGHT )
      .attr( "style", "background-color: lemonchiffon;" )
      .attr( "cursor", "crosshair" );
    this.pointerCords = {i: -1};
    // Enable tabIndex to take key bindings
    this.svg.node().tabIndex = 1;
  },
} 

const updateMapInfo = (width, height) => {
  select("#mapInfo").selectAll( "p" ).data( [{width: width, height: height}] ).enter().append( "p" ).text( d => "Map " + Math.floor(d.width) + "x" + Math.floor(d.height) );
}

export default class extends Controller {
  static targets = [ "inputMap", "inputWidth" ]

  update() {
    this.editor.svg.selectAll( "g" ).remove();
    this.drawMap();
    this.drawRectSelection();
    updateMapInfo(this.editor.mapCharsWidth, this.editor.mapCharsHeight);
  }

  getMapData() {
    return this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      return {
        key: d,
        selected: this.editor.pointerCords && i == this.editor.pointerCords.i,
        editable: this.editor.isCellEditable(i)
      }
    });
  }

  getHeight() {
     return this.inputMapTarget.value.replace(/\s+/g, '').length / this.inputWidthTarget.value;
  }

  poiterMoveUpdate(event) {
    let pt = pointer( event );
    this.editor.pointerCords = {
      i: (Math.floor(pt[1] / this.editor.tileSize.y) * this.inputWidthTarget.value) + Math.floor(pt[0] / this.editor.tileSize.x)
    }
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

  drawRectSelection() {
    if (this.editor.rectSelection.width == 0 || this.editor.rectSelection.height == 0) return;
    this.editor.svg.append( "g" ).attr("id", "rectSelection").append( "rect" )
      .attr( "x", this.editor.rectSelection.width > 0 ? this.editor.rectSelection.x : this.editor.rectSelection.x + this.editor.rectSelection.width )
      .attr( "y", this.editor.rectSelection.height > 0 ? this.editor.rectSelection.y : this.editor.rectSelection.y + this.editor.rectSelection.height )
      .attr( "width", this.editor.rectSelection.width > 0 ? this.editor.rectSelection.width : -this.editor.rectSelection.width )
      .attr( "height", this.editor.rectSelection.height > 0 ? this.editor.rectSelection.height : -this.editor.rectSelection.height )
      .attr( "rx", 6 ).attr( "ry", 6 )
      .attr( "fill", "rgba(25, 50, 220, 0.5)" );
  }

  drawMap() {
    let width = this.editor.mapCharsWidth;
    let data = this.getMapData();
    let scX = scaleLinear().domain([0, width]).range([0, this.editor.mapWidth]);
    let scY = scaleLinear().domain([0, this.editor.mapCharsHeight - 1]).range([0, this.editor.mapHeight - this.editor.tileSize.y]);
    let scColor = scaleOrdinal( schemePastel2 ).domain( extent( data ) );
    let tiles = this.editor.svg.selectAll( "g" )
      .data( data )
      .enter()
      .append( "g" )
      .attr( "class", (d) => d.editable ? "editable" : "" );

    let middleX = this.editor.tileSize.x / 2;
    let middleY = this.editor.tileSize.y / 2;
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
      .attr( "width", this.editor.tileSize.x )
      .attr( "height", this.editor.tileSize.y );

    tiles.append( "text" )
      .text( d => d.key )
      .attr( "x", (d, i) => { return scX(i % width) + middleX - (textSize / 4) } )
      .attr( "y", (d, i) => { return scY(Math.floor(i / width)) + middleY + (textSize / 2) } )
      .attr( "style", "font-size: " + textSize + "px; font-family: 'Comic Sans MS', 'Papyrus', sans-serif;")
  }

  connect() {
    console.log("Connected");
    this.editor = new GameEditor(select( "#mapEditor" ).append( "svg" ).attr( "id", "svgMapEditor" ), this.inputWidthTarget.value, this.getHeight() );
    this.editor.init();

    /**
     * Initialize the pointer hook
     * Should be done on init() function
     * I couldn't find a way because I need to use pointerUpdate
     **/
    this.editor.svg.on( "mousemove", (event) => {
      this.poiterMoveUpdate(event);
    });

    // Set the dragable square selection
    this.editor.svg.call( drag()
      .on( "start", () => {
        let pt = pointer( event, event.target );
        this.editor.rectSelection.x = pt[0];
        this.editor.rectSelection.y = pt[1];
      })
      .on ( "drag", () => {
        let pt = pointer( event, event.target );
        this.editor.rectSelection.width = pt[0] - this.editor.rectSelection.x;
        this.editor.rectSelection.height = pt[1] - this.editor.rectSelection.y;
        this.update();
      })
      .on ( "end", () => {
        if (this.editor.rectSelection.width < 0) {
          this.editor.rectSelection.x = this.editor.rectSelection.x + this.editor.rectSelection.width;
          this.editor.rectSelection.width = -this.editor.rectSelection.width;
        }
        if (this.editor.rectSelection.height < 0) {
          this.editor.rectSelection.y = this.editor.rectSelection.y + this.editor.rectSelection.height;
          this.editor.rectSelection.height = -this.editor.rectSelection.height;
        }
        this.editor.updateSelectedTiles();
        this.editor.rectSelection = {x: 0, y: 0, width: 0, height: 0};
        this.update();
      })
    );

    this.update();
  }

  removeColumn(event) {
    if (event) event.preventDefault();
    if (this.inputWidthTarget.value <= 1) return;
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      if ((i % this.editor.mapCharsWidth) == this.editor.mapCharsWidth - 1) {
        return ("");
      }
      return (d);
    }).join("");
    this.inputWidthTarget.value = this.editor.mapCharsWidth - 1;
    this.editor.changeGameSize(this.editor.mapCharsWidth - 1);
    select( "#mapInfo" ).selectAll( "p" ).remove();
    this.update();
  }

  removeRow(event) {
    if (event) event.preventDefault();
    if (this.inputMapTarget.value.length <= this.inputWidthTarget.value) return;
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').substr(0, this.inputMapTarget.value.length - this.inputWidthTarget.value)
    this.editor.changeGameSize(this.editor.mapCharsWidth, this.editor.mapCharsHeight - 1);
    select( "#mapInfo" ).selectAll( "p" ).remove();
    this.update();
  }

  addColumn(event) {
    if (event) event.preventDefault();
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '').split("").map( (d, i) => {
      if ((i % +this.editor.mapCharsWidth) == this.editor.mapCharsWidth - 1) {
        return (d + "W");
      }
      return (d);
    }).join("");
    this.inputWidthTarget.value = this.editor.mapCharsWidth + 1;
    this.editor.changeGameSize(+this.editor.mapCharsWidth + 1);
    select( "#mapInfo" ).selectAll( "p" ).remove();
    this.update();
  }

  addRow(event) {
    if (event) event.preventDefault();
    this.inputMapTarget.value = this.inputMapTarget.value.replace(/\s+/g, '') + "W".repeat(+this.inputWidthTarget.value);
    this.editor.changeGameSize(this.editor.mapCharsWidth, this.editor.mapCharsHeight + 1);
    select( "#mapInfo" ).selectAll( "p" ).remove();
    this.update();
  }


  onTextChange() {
    console.log("New Text", this.inputWidthTarget.value, this.inputMapTarget.value);
  }

  onWidthChange(event) {
    if (event) event.preventDefault();
    let changeRatio = this.editor.mapCharsWidth - this.inputWidthTarget.value;
    if (changeRatio < 0) {
      for (let i = changeRatio; i != 0;  i++) {
        this.addColumn();
      }
    } else {
      for (let i = changeRatio; i != 0;  i--) {
        this.removeColumn();
      }
    }
  }

}
