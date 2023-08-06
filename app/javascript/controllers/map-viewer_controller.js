import { Controller } from "@hotwired/stimulus"
import { select, scaleLinear, scaleOrdinal, extent, schemePastel2 } from "d3"

const MAP_WIDTH = 375;
const MAP_HEIGHT = 200;

export default class extends Controller {
  static values = {
    map: String,
    width: Number
  }
  connect() {
    let map = this.mapValue.replace(/\s+/g, '');
    let width = this.widthValue;
    let height = map.length / width;
    let tile_size = {x: MAP_WIDTH / width, y: MAP_HEIGHT / height};
    let svg = select(this.element);

    let data = map.split("");
    let scX = scaleLinear().domain([0, width]).range([0, MAP_WIDTH]);
    let scY = scaleLinear().domain([0, height - 1]).range([0, MAP_HEIGHT - tile_size.y]);
    let scColor = scaleOrdinal( schemePastel2 ).domain( extent( data ) );

    svg.attr("height", MAP_HEIGHT);
    svg.attr("width", MAP_WIDTH);
    
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
      .attr( "stroke", "gray" ).attr( "fill", d => scColor(d) )
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
}
