import { Controller } from "@hotwired/stimulus"
import { select, scaleLinear, scaleOrdinal, extent, schemePastel2 } from "d3"

const MAP_WIDTH = 375;
const MAP_HEIGHT = 200;
let scColor = (data) => scaleOrdinal( schemePastel2 ).domain( extent( data ) );

export const drawSvgMap = (svg, map, width, mapWidthPX = MAP_WIDTH, mapHeightPX = MAP_HEIGHT, fColor = scColor) => {
  map = map.replace(/\s+/g, '');
    let height = Math.floor(map.length / width);
    let tile_size = {x: mapWidthPX / width, y: mapHeightPX / height};

    let data = map.split("");
    let scX = scaleLinear().domain([0, width]).range([0, mapWidthPX]);
    let scY = scaleLinear().domain([0, height - 1]).range([0, mapHeightPX - tile_size.y]);
    let ffColor = fColor(data);

    svg.selectAll( "rect" ).remove();
    svg.attr("height", mapHeightPX);
    svg.attr("width", mapWidthPX);
    
    let tiles = svg.selectAll( "rect" )
      .data( data )
      .enter()
      .append( "g" )

    let middleX = tile_size.x / 2;
    let middleY = tile_size.y / 2;
    let textSize;
    if (middleX < middleY) {
      textSize = middleX * 1.25;
    } else {
      textSize = middleY * 1.25;
    }

    tiles.append( "rect" )
      .attr( "stroke", "gray" ).attr( "fill", d => ffColor(d) )
      .attr( "x", (d, i) => { return scX(i % width) } )
      .attr( "y", (d, i) => { return scY(Math.floor(i / width)) } )
      .attr( "width", tile_size.x )
      .attr( "height", tile_size.y );

    tiles.append( "text" )
      .text( d => d )
      .attr( "x", (d, i) => { return scX(i % width) + middleX - (textSize / 4) } )
      .attr( "y", (d, i) => { return scY(Math.floor(i / width)) + middleY + (textSize / 2) } )
      .attr( "style", "font-size: " + textSize + "px; font-family: 'Comic Sans MS', 'Papyrus', sans-serif;")
 }

export default class extends Controller {
  static values = {
    map: String,
    width: Number
  }
  connect() {
    let f1 = (key) => {
      if (key == "O") {
        return "red";
      } else {
        return "pink";
      }
    }

    let f2 = (data) => {
      return f1;
    }

    drawSvgMap(select(this.element), this.mapValue, this.widthValue);
  }
}
