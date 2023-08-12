import { gameData } from "controllers/game_controller"

const SCREEN_GAME = 0;
const SCREEN_MAP = 1;
const SCREEN_MENU = 2;

function GameWindow(canvas, gameWidth = 400)
{
  let map = gameData["game"]["map_terrain"];
  let mapWidth = gameData["game"]["map_width"];

  this.width = canvas.width;
  this.height = canvas.height;
  this.frameRate = 64; // This is how many times per second the window is updated
  this.canvas = canvas;  
  this.canvasContext = this.canvas.getContext( '2d' );
   
  // Create a buffer canvas 
  this.bufferCanvas = document.createElement( 'canvas' );
  this.bufferCanvas.width = canvas.width;
  this.bufferCanvas.height = canvas.height;
  this.bufferCanvasContext = this.bufferCanvas.getContext( '2d' );
  this.bufferCanvasPixels = this.bufferCanvasContext.getImageData(0, 0, canvas.width, canvas.height); // Returns the matrix of pixels

  this.TILE_SIZE = 64;
  this.WALL_HEIGHT = 64;

  // Game Projection Dimensions
  this.PROJECTIONPLANEWIDTH = gameWidth;
  this.PROJECTIONPLANEHEIGHT = canvas.height;
  
  this.ANGLE60 = this.PROJECTIONPLANEWIDTH; // 60deg FOV to simulate human vision
  this.ANGLE30 = Math.floor(this.ANGLE60 / 2);
  this.ANGLE15 = Math.floor(this.ANGLE30 / 2);
  this.ANGLE90 = Math.floor(this.ANGLE30 * 3);
  this.ANGLE180 = Math.floor(this.ANGLE90 * 2);
  this.ANGLE270 = Math.floor(this.ANGLE90 * 3);
  this.ANGLE360 = Math.floor(this.ANGLE60 * 6);
  this.ANGLE0 = 0;
  this.ANGLE5 = Math.floor(this.ANGLE30 / 6);
  this.ANGLE3 = Math.floor(this.ANGLE30 / 10);
  this.ANGLE10 = Math.floor(this.ANGLE5 * 2);
  this.ANGLE45 = Math.floor(this.ANGLE15 * 3);
  
  // Trigo Table, Normal & Inverse
  this.fSinTable = [];
  this.fISinTable = [];
  this.fCosTable = [];
  this.fICosTable = [];
  this.fTanTable = [];
  this.fITanTable = [];
  this.fFishTable = [];
  this.fXStepTable = [];
  this.fYStepTable = [];

  // Player
  this.pX = 100;
  this.pY = 160;
  this.pAngle = 0;
  this.pDTPP = (this.PROJECTIONPLANEWIDTH / 2) / Math.tan(30 * Math.PI / 180); // Player distance to Projection Plane
  this.pHeight = 32;
  this.pSpeed = 4;
  
  // Half of the screen height
  this.fProjectionPlaneYCenter = this.PROJECTIONPLANEHEIGHT / 2;
  this.fProjectionPlaneXCenter = this.PROJECTIONPLANEHEIGHT / 2;

  // movement flag
  this.fKeyUp = false;
  this.fKeyDown = false;
  this.fKeyLeft = false; 
  this.fKeyRight = false;
  this.fKeyLookUp = false;
  this.fKeyLookDown = false;
  this.fKeyFlyUp = false;
  this.fKeyFlyDown = false;
  this.fKeyRun = false;

  this.fMouseLeft = false; 
  this.fMouseRight = false;
  this.fMouseLookUp = false;
  this.fMouseLookDown = false;
  
  this.fMap = map.replace(/\s+/g, '');
  this.MAP_WIDTH = mapWidth;
  this.MAP_HEIGHT = Math.floor(this.fMap.length / this.MAP_WIDTH); // Not sure about the floor here ...
  
  this.animationFrameID;
  
  this.fWallTextureCanvas;
  this.fWallTexturePixels;
  this.fBackgroundImageArc = 0;
  
  this.baseLightValue = 100;
  this.baseLightValueDelta = 1;
  this.lastMousePosition;
  this.mouseMoving = false;

  // the following variables are used to keep the player coordinate in the overhead map
  this.fPlayerMapX;
  this.fPlayerMapY;
  this.fMinimapWidth = Math.floor(this.width / this.MAP_WIDTH);
  this.fMinimapHeight = Math.floor(this.height / this.MAP_HEIGHT);
  
  this.players = [];
  this.screen = SCREEN_GAME;

  /**
   * One attachment should look like this:
   * { key_code: 'x'
   *  attachment (Object) {
   *    is_solid: true,
   *    images:
   *    [
   *      {
   *        perspective: W (W - West, E - East, N - North, S - South, C - Ceiling, F - Floor)
   *        textureImage: Image
   *        textureCanvas: Canvas
   *        texturePixels: TextureBuffer
   *        texturePixels: TexturePixels
   *      },
   *    ]
   *  }
   * }
   * 
   * Example:
   * 
   * {
   *  A: {true, Image, Canvas, PixelsBuffer},
   *  O: {false, Image, Canvas, PixelsBuffer}
   * }
  **/
  this.attachments = {};
  this.solids = "";
}

GameWindow.prototype = 
{
  loadImage : function(image, onTextureLoaded, texture_path)
  {
    image.crossOrigin = "Anonymous";
    image.onload = onTextureLoaded;
    image.src = texture_path;
  },

  loadBuffer : function(bufferCanvas, texture) {
    bufferCanvas.width = texture.width;
    bufferCanvas.height = texture.height;
    bufferCanvas.getContext('2d').drawImage(texture, 0, 0);
  },

  loadAttachments : function()
  {
    gameData["elements"].forEach((data) => {
      let element = data["element"];
      let image_path = data["image_path"];
      if (!this.attachments[element["key_code"]]) {
        this.attachments[element["key_code"]] = {};
        this.attachments[element["key_code"]].images = [];
      }
      this.attachments[element["key_code"]].is_solid = element["element_type"].includes("wall");
      if (this.attachments[element["key_code"]].is_solid) {
        this.solids += element["key_code"];
      }
      let tmp = {};
      if ( element["element_type"].includes("floor")) {
        tmp.perspective = "F";
      }
      else if ( element["element_type"].includes("ceiling")) {
        tmp.perspective = "C";
      } else {
        tmp.perspective = element["element_type"].charAt(element["element_type"].length - 1);
      }
      tmp.textureImage = new Image();
      tmp.textureImage.crossOrigin = "Anonymous";
      tmp.textureImage.onload = this.onTextureLoaded.bind(this, tmp);
      tmp.textureImage.src = image_path;
      this.attachments[element["key_code"]].images.push(tmp);
    });
  },

  getAttachment : function(keyCode, perspective)
  {
    if (!this.attachments[keyCode]) {
      return (null);
    }
    for (let i = 0; i < this.attachments[keyCode].images.length; i++) {
      if (this.attachments[keyCode].images[i].perspective == perspective)
        return (this.attachments[keyCode].images[i]);
    }
    return (null);
  },

  onTextureLoaded : function(element) {
    element.textureBuffer = document.createElement('canvas');
    this.loadBuffer(element.textureBuffer, element.textureImage);
    element.texturePixels = element.textureBuffer.getContext('2d').getImageData(0, 0, element.textureBuffer.width, element.textureBuffer.height).data;
  },

  loadWallTexture : function() {
    this.fWallTexture = new Image();
    this.loadImage(this.fWallTexture, this.onWallTextureLoaded.bind(this), "/assets/Wall-5.png");
  },

  loadFloorTexture : function()
  {
    this.fFloorTexture = new Image();
    this.loadImage(this.fFloorTexture, this.onFloorTextureLoaded.bind(this), "/assets/Wall-2.png")
  },
 
  loadCeilingTexture : function()
  {
    this.fCeilingTexture = new Image();
    this.loadImage(this.fCeilingTexture, this.onCeilingTextureLoaded.bind(this), "/assets/Wall-3.png")
  },
  
  loadBackgroundTexture : function()
  {
    this.fBackgroundTexture = new Image();
    this.loadImage(this.fBackgroundTexture, this.onBackgroundTextureLoaded.bind(this), "/assets/Wall-4.png")
  },

  onWallTextureLoaded : function()
  {
    this.fWallTextureBuffer = document.createElement('canvas');
    this.loadBuffer(this.fWallTextureBuffer, this.fWallTexture);
    this.fWallTexturePixels = this.fWallTextureBuffer.getContext('2d').getImageData(0, 0, this.fWallTextureBuffer.width, this.fWallTextureBuffer.height).data;
  },

  onFloorTextureLoaded : function()
  {
    this.fFloorTextureBuffer = document.createElement('canvas');
    this.loadBuffer(this.fFloorTextureBuffer, this.fFloorTexture);
    this.fFloorTexturePixels = this.fFloorTextureBuffer.getContext('2d').getImageData(0, 0, this.fFloorTextureBuffer.width, this.fFloorTextureBuffer.height).data;
  },
  
  onCeilingTextureLoaded : function()
  {
    this.fCeilingTextureBuffer = document.createElement('canvas');    
    this.loadBuffer(this.fCeilingTextureBuffer, this.fCeilingTexture);
    this.fCeilingTexturePixels = this.fCeilingTextureBuffer.getContext('2d').getImageData(0, 0, this.fCeilingTextureBuffer.width, this.fCeilingTextureBuffer.height).data;
  },  
  
  onBackgroundTextureLoaded : function()
  {
    this.fBackgroundTextureBuffer = document.createElement('canvas');   
    this.loadBuffer(this.fBackgroundTextureBuffer, this.fBackgroundTexture);
    this.fBackgroundTexturePixels = this.fBackgroundTextureBuffer.getContext('2d').getImageData(0, 0, this.fBackgroundTextureBuffer.width, this.fBackgroundTextureBuffer.height).data;
  },  

  arcToRad: function(arcAngle)
  {
    return ((arcAngle * Math.PI) / this.ANGLE180);    
  },
  
  // This function is only used on the minimap to draw a line
  drawLine: function(startX, startY, endX, endY, red, green, blue, alpha)
  {
    var bytesPerPixel = 4;
    // changes in x and y
    var xIncrement, yIncrement;  

    // calculate Ydistance  
    var dy = endY - startY;             
    
    // if moving negative dir (up)  
    // note that we can simplify this function if we can guarantee that
    // the line will always move in one direction only
    if (dy < 0)             
    {
      // get abs
      dy =- dy;
      // negative movement
      yIncrement =- this.bufferCanvasPixels.width * bytesPerPixel;
    }
    else
      yIncrement = this.bufferCanvasPixels.width * bytesPerPixel;
                
    // calc x distance                      
    var dx = endX - startX;         
    
    // if negative dir (left)
    // note that we can simplify this function if we can guarantee that
    // the line will always move in one direction only
    if (dx < 0)
    {
      dx =- dx;
      xIncrement =- bytesPerPixel;
    }
    else
      xIncrement = bytesPerPixel;

    // deflation    
    var error = 0;
    var targetIndex = (bytesPerPixel * this.bufferCanvasPixels.width) * startY + (bytesPerPixel * startX);
    
    // if movement in x direction is larger than in y
    // ie: width > height
    // we draw each row one by one
    if (dx > dy)
    {                     
      // length = width +1
      var length = dx;
      
      for (var i = 0; i < length; i++)
      {
        if (targetIndex < 0)
          break;
          
        this.bufferCanvasPixels.data[targetIndex] = red;
        this.bufferCanvasPixels.data[targetIndex + 1] = green;
        this.bufferCanvasPixels.data[targetIndex + 2] = blue;
        this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
        
        // either move left/right
        targetIndex += xIncrement;           
        // cumulate error term
        error += dy;
                    
        // is it time to move y direction (chage row)                           
        if (error >= dx)
        {
          error -= dx;
          // move to next row
          targetIndex += yIncrement;
        }
      }
    }
    // if movement in y direction is larger than in x
    // ie: height > width
    // we draw each column one by one
    // note that a diagonal line will go here because xdiff = ydiff
    else //(YDiff>=XDiff)
    {                       
      var length = dy;
      
      for (var i = 0; i < length; i++)
      {       
        if (targetIndex < 0)
          break;
          
          
        this.bufferCanvasPixels.data[targetIndex] = red;
        this.bufferCanvasPixels.data[targetIndex + 1] = green;
        this.bufferCanvasPixels.data[targetIndex + 2] = blue;
        this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
        
        targetIndex += yIncrement;
        error += dx;
        
        if (error >= dy)
        {
          error -= dy;
          targetIndex += xIncrement;
        }
      }
    }
  },

  drawWallSliceRectangleTinted: function(x, y, width, height, xOffset, brightnessLevel, image)
  {
    // wait until the texture loads
    if (!image) {
      image = {};
      //image.textureImage = 
      image.textureBuffer = this.fWallTextureBuffer;
      image.texturePixels = this.fWallTexturePixels;
    }
    if (image.textureBuffer == undefined)
      return;
    
    var dy = height;
    x = Math.floor(x);
    y = Math.floor(y);
    xOffset = Math.floor(xOffset);
    var bytesPerPixel = 4;
    
    var sourceIndex = (bytesPerPixel * xOffset);
    var lastSourceIndex = sourceIndex + (image.textureBuffer.width * image.textureBuffer.height * bytesPerPixel);
    
    //var targetCanvasPixels=this.canvasContext.createImageData(0, 0, width, height);
    var targetIndex = (this.bufferCanvasPixels.width * bytesPerPixel) * y + (bytesPerPixel * x);
    
    
    var heightToDraw = height;
    // clip bottom
    if (y + heightToDraw > this.bufferCanvasPixels.height)
      heightToDraw = this.bufferCanvasPixels.height - y;

    
    var yError = 0;
    
    // we need to check this, otherwise, program might crash when trying
    // to fetch the shade if this condition is true (possible if height is 0)
    if (heightToDraw < 0)
      return;

    // we're going to draw the first row, then move down and draw the next row
    // and so on we can use the original x destination to find out
    // the x position of the next row 
    // Remeber that the source bitmap is rotated, so the width is actually the
    // height
    while (true)
    {                     
      // if error < actualHeight, this will cause row to be skipped until
      // this addition sums to scaledHeight
      // if error > actualHeight, this ill cause row to be drawn repeatedly until
      // this addition becomes smaller than actualHeight
      // 1) Think the image height as 100, if percent is >= 100, we'll need to
      // copy the same pixel over and over while decrementing the percentage.  
      // 2) Similarly, if percent is <100, we skip a pixel while incrementing
      // and do 1) when the percentage we're adding has reached >=100
      yError += height;
                          
      // dereference for faster access (especially useful when the same bit
      // will be copied more than once)

      // Cheap shading trick by using brightnessLevel (which doesn't really have to correspond to "brightness") 
      // to alter colors.  You can use logarithmic falloff or linear falloff to produce some interesting effect
      var red = Math.floor(image.texturePixels[sourceIndex] * brightnessLevel);
      var green = Math.floor(image.texturePixels[sourceIndex + 1] * brightnessLevel);
      var blue = Math.floor(image.texturePixels[sourceIndex + 2] * brightnessLevel);
      var alpha = Math.floor(image.texturePixels[sourceIndex + 3]);
      
      // while there's a row to draw & not end of drawing area
      while (yError >= image.textureBuffer.width)
      {                  
        yError -= image.textureBuffer.width;
        this.bufferCanvasPixels.data[targetIndex] = red;
        this.bufferCanvasPixels.data[targetIndex + 1] = green;
        this.bufferCanvasPixels.data[targetIndex + 2] = blue;
        this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
        targetIndex += (bytesPerPixel * this.bufferCanvasPixels.width);
        // clip bottom (just return if we reach bottom)
        heightToDraw--;
        if (heightToDraw < 1)
          return;
      } 
      sourceIndex += (bytesPerPixel * image.textureBuffer.width);
      if (sourceIndex > lastSourceIndex)
        sourceIndex = lastSourceIndex;      
    }

  },  
  
  clearbufferCanvas : function()
  {
    // no need to do anything because the screen will be redrwan fully anyway
  },
  
  blitbufferCanvas : function()
  {   
    this.canvasContext.putImageData(this.bufferCanvasPixels, 0, 0);
  },
  
  // For minimap only
  drawFillRectangle: function(x, y, width, height, red, green, blue, alpha)
  {
    var bytesPerPixel = 4;
    //var targetCanvasPixels=this.canvasContext.createImageData(0, 0, width, height);
    var targetIndex = (bytesPerPixel * this.bufferCanvasPixels.width) * y + (bytesPerPixel * x);
    for (var h = 0; h < height; h++)
    {
      for (var w = 0; w < width; w++)
      {
        this.bufferCanvasPixels.data[targetIndex] = red;
        this.bufferCanvasPixels.data[targetIndex + 1] = green;
        this.bufferCanvasPixels.data[targetIndex + 2] = blue;
        this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
        targetIndex += bytesPerPixel;
      }
      targetIndex = ((bytesPerPixel * this.bufferCanvasPixels.width) * (y + h)) + (bytesPerPixel * x);
    }
  },
  
  init: function()
  {
    this.loadAttachments();
    console.log(this.solids);
    console.log(this.getAttachment("W", "N"));
    this.loadWallTexture();
    this.loadFloorTexture();
    this.loadCeilingTexture();
    this.fSinTable = new Array(this.ANGLE360 + 1);
    this.fISinTable = new Array(this.ANGLE360 + 1);
    this.fCosTable = new Array(this.ANGLE360 + 1);
    this.fICosTable = new Array(this.ANGLE360 + 1);
    this.fTanTable = new Array(this.ANGLE360 + 1);
    this.fITanTable = new Array(this.ANGLE360 + 1);
    this.fFishTable = new Array(this.ANGLE360 + 1);
    this.fXStepTable = new Array(this.ANGLE360 + 1);
    this.fYStepTable = new Array(this.ANGLE360 + 1);

    let radian;
    for (let i = 0; i <= this.ANGLE360; i++)
    {
      // Populate tables with their radian values.
      // (The addition of 0.0001 is a kludge to avoid divisions by 0. Removing it will produce unwanted holes in the wall when a ray is at 0, 90, 180, or 270 degree angles)
      radian = this.arcToRad(i) + (0.0001);
      this.fSinTable[i] = Math.sin(radian);
      this.fISinTable[i] = (1.0 / (this.fSinTable[i]));
      this.fCosTable[i] = Math.cos(radian);
      this.fICosTable[i] = (1.0 / (this.fCosTable[i]));
      this.fTanTable[i] = Math.tan(radian);
      this.fITanTable[i] = (1.0 / this.fTanTable[i]);

      // Next we crate a table to speed up wall lookups.
      // 
      //  You can see that the distance between walls are the same
      //  if we know the angle
      //  _____|_/next xi______________
      //       |
      //  ____/|next xi_________   slope = tan = height / dist between xi's
      //     / |
      //  __/__|_________  dist between xi = height/tan where height=tile size
      // old xi|
      //                  distance between xi = x_step[view_angle];
      
      
      
      // Facing LEFT
      if (i >= this.ANGLE90 && i < this.ANGLE270)
      {
        this.fXStepTable[i] = (this.TILE_SIZE / this.fTanTable[i]);
        if (this.fXStepTable[i] > 0)
          this.fXStepTable[i] =- this.fXStepTable[i];
      }
      // facing RIGHT
      else
      {
        this.fXStepTable[i] = (this.TILE_SIZE / this.fTanTable[i]);
        if (this.fXStepTable[i] < 0)
          this.fXStepTable[i] =- this.fXStepTable[i];
      }

      // FACING DOWN
      if (i >= this.ANGLE0 && i < this.ANGLE180)
      {
        this.fYStepTable[i] = (this.TILE_SIZE * this.fTanTable[i]);
        if (this.fYStepTable[i] < 0)
          this.fYStepTable[i] =- this.fYStepTable[i];
      }
      // FACING UP
      else
      {
        this.fYStepTable[i] = (this.TILE_SIZE * this.fTanTable[i]);
        if (this.fYStepTable[i] > 0)
          this.fYStepTable[i] =- this.fYStepTable[i];
      }
    }

    // Create table for fixing FISHBOWL distortion
    for (let i =- this.ANGLE30; i <= this.ANGLE30; i++)
    {
      radian = this.arcToRad(i);
      // we don't have negative angle, so make it start at 0
      // this will give range from column 0 to 319 (PROJECTONPLANEWIDTH) since we only will need to use those range
      this.fFishTable[i + this.ANGLE30] = (1.0 / Math.cos(radian));
    }  
  },
  
  //*******************************************************************//
  //* Draw map on the right side
  //*******************************************************************//
  drawOverheadMap : function()
  {
    this.drawFillRectangle(0, 0, this.width, this.height, 0, 0, 0, 255);
    for (var r = 0; r < this.MAP_HEIGHT; r++)
    {
      for (var c = 0; c < this.MAP_WIDTH; c++)
      {
        if (this.solids.includes(this.fMap.charAt(r * this.MAP_WIDTH + c)))
        {
          this.drawFillRectangle(c * this.fMinimapWidth,
            (r * this.fMinimapHeight), this.fMinimapWidth, this.fMinimapHeight + 1, 0, 0,0, 255);
        }
        else
        {
          this.drawFillRectangle(c*this.fMinimapWidth,
            (r * this.fMinimapHeight), this.fMinimapWidth, this.fMinimapHeight + 1, 255, 255,255, 255);
        }
      }
    }
    // Draw player position on the overhead map
    let player_size = 5;
    this.fPlayerMapX = Math.floor((this.pX/this.TILE_SIZE) * this.fMinimapWidth) - Math.floor(player_size / 2);
    this.fPlayerMapY = Math.floor((this.pY/this.TILE_SIZE) * this.fMinimapHeight) - Math.floor(player_size / 2);
    this.drawFillRectangle(this.fPlayerMapX, this.fPlayerMapY, player_size, player_size, 242, 42, 142, 255);
    this.drawLine(
      this.fPlayerMapX + Math.floor(player_size / 2), 
      this.fPlayerMapY + Math.floor(player_size / 2), 
      Math.floor(this.fPlayerMapX + Math.floor(player_size / 2) + (this.fCosTable[this.pAngle] * 10)),
      Math.floor(this.fPlayerMapY + Math.floor(player_size / 2) + (this.fSinTable[this.pAngle] * 10)), 
      255, 42, 0, 255);
  },
  

  rgbToHexColor : function(red, green, blue) 
  {
    var result = "#" +
      red.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + "" +
      green.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + "" +
      blue.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    return result;
  },

  //*******************************************************************//
  //* Draw background image
  //*******************************************************************//
  drawBackground : function()
  {
    //return;
    // sky
    var color = 255;
    var row;
    var incement = 4;
    for (row = 0; row < this.PROJECTIONPLANEHEIGHT / 2; row += incement)
    {
      this.drawFillRectangle(0, row, this.PROJECTIONPLANEWIDTH, incement, color / 2, color, 125, 255);      
      color -= incement * 2;
    }
    // ground
    color = 22;
    for (; row < this.PROJECTIONPLANEHEIGHT; row += incement)
    {
      this.drawFillRectangle(0, row, this.PROJECTIONPLANEWIDTH,incement, color, 20, 20, 255);      
      color += incement;
    }
    this.fBackgroundImageArc;
  },
  
  //*******************************************************************//
  //* Renderer
  //*******************************************************************//
  raycast : function()
  {
    var verticalGrid;        // horizotal or vertical coordinate of intersection
    var horizontalGrid;      // theoritically, this will be multiple of TILE_SIZE
                 // , but some trick did here might cause
                 // the values off by 1
    var distToNextVerticalGrid; // how far to the next bound (this is multiple of
    var distToNextHorizontalGrid; // tile size)
    var xIntersection;  // x and y intersections
    var yIntersection;
    var distToNextXIntersection;
    var distToNextYIntersection;

    var xGridIndex;        // the current cell that the ray is in
    var yGridIndex;

    var distToVerticalGridBeingHit;      // the distance of the x and y ray intersections from
    var distToHorizontalGridBeingHit;      // the viewpoint
    let mapIndexH, mapIndexV = 0;

    var castArc, castColumn;
    
    castArc = this.pAngle;
    // field of view is 60 degree with the point of view (player's direction in the middle)
    // 30  30
    //    ^
    //  \ | /
    //   \|/
    //    v
    // we will trace the rays starting from the leftmost ray
    castArc -= this.ANGLE30;
    // wrap around if necessary
    if (castArc < 0)
    {
      castArc = this.ANGLE360 + castArc;
    }

    for (castColumn = 0; castColumn < this.PROJECTIONPLANEWIDTH; castColumn++)
    {
      // Ray is between 0 to 180 degree (1st and 2nd quadrant).
      
      // Ray is facing down
      if (castArc > this.ANGLE0 && castArc < this.ANGLE180)
      {
        // truncuate then add to get the coordinate of the FIRST grid (horizontal
        // wall) that is in front of the player (this is in pixel unit)
        // ROUNDED DOWN
        horizontalGrid = Math.floor(this.pY / this.TILE_SIZE) * this.TILE_SIZE + this.TILE_SIZE;

        // compute distance to the next horizontal wall
        distToNextHorizontalGrid = this.TILE_SIZE;

        var xtemp = this.fITanTable[castArc] * (horizontalGrid - this.pY);
        // we can get the vertical distance to that wall by
        // (horizontalGrid-playerY)
        // we can get the horizontal distance to that wall by
        // 1/tan(arc)*verticalDistance
        // find the x interception to that wall
        xIntersection = xtemp + this.pX;
      }
      // Else, the ray is facing up
      else
      {
        horizontalGrid = Math.floor(this.pY / this.TILE_SIZE) * this.TILE_SIZE;
        distToNextHorizontalGrid = -this.TILE_SIZE;

        var xtemp = this.fITanTable[castArc] * (horizontalGrid - this.pY);
        xIntersection = xtemp + this.pX;

        horizontalGrid--;
      }
      // LOOK FOR HORIZONTAL WALL
      
      // If ray is directly facing right or left, then ignore it 
      if (castArc == this.ANGLE0 || castArc == this.ANGLE180)
      {
        distToHorizontalGridBeingHit = Number.MAX_VALUE;
      }
      // else, move the ray until it hits a horizontal wall
      else
      {
        distToNextXIntersection = this.fXStepTable[castArc];
        while (true)
        {
          xGridIndex = Math.floor(xIntersection / this.TILE_SIZE);
          yGridIndex = Math.floor(horizontalGrid / this.TILE_SIZE);
          mapIndexH = Math.floor(yGridIndex * this.MAP_WIDTH + xGridIndex);

          // If we've looked as far as outside the map range, then bail out
          if ((xGridIndex >= this.MAP_WIDTH) ||
            (yGridIndex >= this.MAP_HEIGHT) ||
            xGridIndex < 0 || yGridIndex < 0)
          {
            distToHorizontalGridBeingHit = Number.MAX_VALUE;
            break;
          }
          // If the grid is not an Opening, then stop
          else if (this.solids.includes(this.fMap.charAt(mapIndexH)))
          {
            distToHorizontalGridBeingHit = (xIntersection-this.pX)*this.fICosTable[castArc];
            break;
          }
          // Else, keep looking.  At this point, the ray is not blocked, extend the ray to the next grid
          else
          {
            xIntersection += distToNextXIntersection;
            horizontalGrid += distToNextHorizontalGrid;
          }
        }
      }

      // FOLLOW X RAY
      if (castArc < this.ANGLE90 || castArc > this.ANGLE270)
      {
        verticalGrid = this.TILE_SIZE + Math.floor(this.pX / this.TILE_SIZE) * this.TILE_SIZE;
        distToNextVerticalGrid = this.TILE_SIZE;

        var ytemp = this.fTanTable[castArc] * (verticalGrid - this.pX);
        yIntersection = ytemp + this.pY;
      }
      // RAY FACING LEFT
      else
      {
        verticalGrid = Math.floor(this.pX / this.TILE_SIZE) * this.TILE_SIZE;
        distToNextVerticalGrid = -this.TILE_SIZE;

        var ytemp = this.fTanTable[castArc] * (verticalGrid - this.pX);
        yIntersection = ytemp + this.pY;

        verticalGrid--;
      }
        // LOOK FOR VERTICAL WALL
      if (castArc == this.ANGLE90 || castArc == this.ANGLE270)
      {
        distToVerticalGridBeingHit = Number.MAX_VALUE;
      }
      else
      {
        distToNextYIntersection = this.fYStepTable[castArc];
        while (true)
        {
          // compute current map position to inspect
          xGridIndex = Math.floor(verticalGrid / this.TILE_SIZE);
          yGridIndex = Math.floor(yIntersection / this.TILE_SIZE);

          mapIndexV=Math.floor(yGridIndex * this.MAP_WIDTH + xGridIndex);
          
          if ((xGridIndex >= this.MAP_WIDTH) || 
            (yGridIndex >= this.MAP_HEIGHT) ||
            xGridIndex < 0 || yGridIndex < 0)
          {
            distToVerticalGridBeingHit = Number.MAX_VALUE;
            break;
          }
          else if (this.solids.includes(this.fMap.charAt(mapIndexV)))
          {
            distToVerticalGridBeingHit = (yIntersection-this.pY) * this.fISinTable[castArc];
            break;
          }
          else
          {
            yIntersection += distToNextYIntersection;
            verticalGrid += distToNextVerticalGrid;
          }
        }
      }

      // DRAW THE WALL SLICE
      var scaleFactor;
      var dist;
      var xOffset;
      var topOfWall;   // used to compute the top and bottom of the sliver that
      var bottomOfWall;   // will be the staring point of floor and ceiling
      // determine which ray strikes a closer wall.
      // if yray distance to the wall is closer, the yDistance will be shorter than
      // the xDistance
      var isVerticalHit = false;
      var distortedDistance = 0;
      var bottomOfWall;
      var topOfWall;
      var mapIndexHit = mapIndexH;
      if (distToHorizontalGridBeingHit < distToVerticalGridBeingHit)
      {
        // the next function call (drawRayOnMap()) is not a part of raycasting rendering part, 
        // it just draws the ray on the overhead map to illustrate the raycasting process
        dist = distToHorizontalGridBeingHit / this.fFishTable[castColumn];
//        dist_y /= convert_to_float(GLfishTable[GLcastColumn]);
        distortedDistance=dist;
        var ratio = this.pDTPP/dist;
        bottomOfWall = (ratio * this.pHeight + this.fProjectionPlaneYCenter);
        var scale = (this.pDTPP*this.WALL_HEIGHT/dist); 
        topOfWall = bottomOfWall - scale;
            /*dist_y /= convert_to_float(GLfishTable[GLcastColumn]);
            float ratio = GLplayerDistance/dist_y;
            bot_of_wall = (int)(ratio * GLplayerHeight + GLviewportCenter);
            scale = (int)(GLplayerDistance*GLwallHeight/dist_y);
            top_of_wall = bot_of_wall - scale;*/
      
        
        xOffset=xIntersection%this.TILE_SIZE;
      }
      // else, we use xray instead (meaning the vertical wall is closer than
      //   the horizontal wall)
      else
      {
        mapIndexHit = mapIndexV;
        isVerticalHit=true;
        // the next function call (drawRayOnMap()) is not a part of raycating rendering part, 
        // it just draws the ray on the overhead map to illustrate the raycasting process
        dist=distToVerticalGridBeingHit/this.fFishTable[castColumn];

        xOffset=yIntersection%this.TILE_SIZE;
        
        var ratio = this.pDTPP/dist;
        bottomOfWall = (ratio * this.pHeight + this.fProjectionPlaneYCenter);
        var scale = (this.pDTPP*this.WALL_HEIGHT/dist); 
        topOfWall = bottomOfWall - scale;
      }

      // correct distance (compensate for the fishbown effect)
      //dist /= this.fFishTable[castColumn];
      // projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
      //var projectedWallHeight=(this.WALL_HEIGHT*this.pDTPP/dist);
      //bottomOfWall = this.fProjectionPlaneYCenter+(projectedWallHeight*0.5);
      //topOfWall = this.fProjectionPlaneYCenter-(projectedWallHeight*0.5);
      
      
      // Add simple shading so that farther wall slices appear darker.
      // use arbitrary value of the farthest distance.  
      dist=Math.floor(dist);

      // Trick to give different shades between vertical and horizontal (you could also use different textures for each if you wish to)
      if (isVerticalHit)
      {
        if (castArc < this.ANGLE90 || castArc > this.ANGLE270)
        {
          this.drawWallSliceRectangleTinted(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, this.baseLightValue/(dist), this.getAttachment(this.fMap.charAt(mapIndexHit), "E"));
        }
        else
        {
          this.drawWallSliceRectangleTinted(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, this.baseLightValue/(dist), this.getAttachment(this.fMap.charAt(mapIndexHit), "W"));
        }
      }
      else if (castArc > 0 && castArc < this.ANGLE180)
      {
        this.drawWallSliceRectangleTinted(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, (this.baseLightValue-50)/(dist), this.getAttachment(this.fMap.charAt(mapIndexHit), "S"));
      }
      else
      {
        this.drawWallSliceRectangleTinted(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, (this.baseLightValue-50)/(dist), this.getAttachment(this.fMap.charAt(mapIndexHit), "N"));
      }
        

      
      var bytesPerPixel=4;
      var projectionPlaneCenterY=this.fProjectionPlaneYCenter;
      var lastBottomOfWall = Math.floor(bottomOfWall);
      var lastTopOfWall = Math.floor(topOfWall);
      
      //*************
      // FLOOR CASTING at the simplest!  Try to find ways to optimize this, you can do it!
      //*************
      if (this.fFloorTextureBuffer != undefined)
      {
        // find the first bit so we can just add the width to get the
        // next row (of the same column)
        var targetIndex=lastBottomOfWall * (this.bufferCanvasPixels.width * bytesPerPixel) + (bytesPerPixel * castColumn);
        for (var row = lastBottomOfWall; row < this.PROJECTIONPLANEHEIGHT; row++) 
        {                          
          
          var straightDistance=(this.pHeight) / (row - projectionPlaneCenterY) *
            this.pDTPP;
          
          var actualDistance=straightDistance*
              (this.fFishTable[castColumn]);

          var yEnd = Math.floor(actualDistance * this.fSinTable[castArc]);
          var xEnd = Math.floor(actualDistance * this.fCosTable[castArc]);
    
          // Translate relative to viewer coordinates:
          xEnd += this.pX;
          yEnd += this.pY;

          
          // Get the tile intersected by ray:
          var cellX = Math.floor(xEnd / this.TILE_SIZE);
          var cellY = Math.floor(yEnd / this.TILE_SIZE);
          //console.log("cellX="+cellX+" cellY="+cellY);
          
          //Make sure the tile is within our map
          if ((cellX < this.MAP_WIDTH) &&   
            (cellY < this.MAP_HEIGHT) &&
            cellX >= 0 && cellY >=0)
          {            
            // Find offset of tile and column in texture
            var tileRow = Math.floor(yEnd % this.TILE_SIZE);
            var tileColumn = Math.floor(xEnd % this.TILE_SIZE);
            var floorImage = this.getAttachment(this.fMap.charAt((cellY * this.MAP_WIDTH) + cellX), "F");
            if (!floorImage || !floorImage.textureBuffer) {
              floorImage = {};
              floorImage.textureBuffer = this.fFloorTextureBuffer;
              floorImage.texturePixels = this.fFloorTexturePixels;
            }
            // Pixel to draw
            var sourceIndex=(tileRow * floorImage.textureBuffer.width * bytesPerPixel) + (bytesPerPixel * tileColumn);
            
            // Cheap shading trick
            var brighnessLevel=(150 / (actualDistance));
            var red=Math.floor(floorImage.texturePixels[sourceIndex] * brighnessLevel);
            var green=Math.floor(floorImage.texturePixels[sourceIndex + 1] * brighnessLevel);
            var blue=Math.floor(floorImage.texturePixels[sourceIndex + 2] * brighnessLevel);
            var alpha=Math.floor(floorImage.texturePixels[sourceIndex + 3]);            
            
            // Draw the pixel 
            this.bufferCanvasPixels.data[targetIndex] = red;
            this.bufferCanvasPixels.data[targetIndex + 1] = green;
            this.bufferCanvasPixels.data[targetIndex + 2] = blue;
            this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
            
            // Go to the next pixel (directly under the current pixel)
            targetIndex += (bytesPerPixel * this.bufferCanvasPixels.width);                      
          }                                                              
        } 
      }
      //*************
      // CEILING CASTING at the simplest!  Try to find ways to optimize this, you can do it!
      //*************
      if (this.fCeilingTextureBuffer != undefined)
      {
        //console.log("this.fCeilingTexturePixels[0]="+this.fCeilingTexturePixels[0]);
        // find the first bit so we can just add the width to get the
        // next row (of the same column)

            
        var targetIndex = lastTopOfWall * (this.bufferCanvasPixels.width * bytesPerPixel) + (bytesPerPixel * castColumn);
        for (var row = lastTopOfWall; row >= 0; row--) 
        {                          
          var ratio = (this.WALL_HEIGHT - this.pHeight) / (projectionPlaneCenterY - row);

          var diagonalDistance=Math.floor((this.pDTPP * ratio) *
            (this.fFishTable[castColumn]));

          var yEnd = Math.floor(diagonalDistance * this.fSinTable[castArc]);
          var xEnd = Math.floor(diagonalDistance * this.fCosTable[castArc]);
    
          // Translate relative to viewer coordinates:
          xEnd += this.pX;
          yEnd += this.pY;

          // Get the tile intersected by ray:
          var cellX = Math.floor(xEnd / this.TILE_SIZE);
          var cellY = Math.floor(yEnd / this.TILE_SIZE);
          //console.log("cellX="+cellX+" cellY="+cellY);
            
          //Make sure the tile is within our map
          if ((cellX < this.MAP_WIDTH) &&   
            (cellY < this.MAP_HEIGHT) &&
            cellX >= 0 && cellY >= 0)
          {            
          
            var ceilingImage = this.getAttachment(this.fMap.charAt((cellY * this.MAP_WIDTH) + cellX), "C");
            if (!ceilingImage || !ceilingImage.textureBuffer) {
              ceilingImage = {};
              ceilingImage.textureBuffer = this.fCeilingTextureBuffer;
              ceilingImage.texturePixels = this.fCeilingTexturePixels;
            }
            // Find offset of tile and column in texture
            var tileRow = Math.floor(yEnd % this.TILE_SIZE);
            var tileColumn = Math.floor(xEnd % this.TILE_SIZE);
            // Pixel to draw
            var sourceIndex=(tileRow * ceilingImage.textureBuffer.width * bytesPerPixel) + (bytesPerPixel * tileColumn);
            //console.log("sourceIndex="+sourceIndex);
            // Cheap shading trick
            var brighnessLevel=(100 / diagonalDistance);
            var red=Math.floor(ceilingImage.texturePixels[sourceIndex] * brighnessLevel);
            var green=Math.floor(ceilingImage.texturePixels[sourceIndex + 1] * brighnessLevel);
            var blue=Math.floor(ceilingImage.texturePixels[sourceIndex + 2] * brighnessLevel);
            var alpha=Math.floor(ceilingImage.texturePixels[sourceIndex + 3]);            
            
            // Draw the pixel 
            this.bufferCanvasPixels.data[targetIndex]=red;
            this.bufferCanvasPixels.data[targetIndex + 1] = green;
            this.bufferCanvasPixels.data[targetIndex + 2] = blue;
            this.bufferCanvasPixels.data[targetIndex + 3] = alpha;
            // Go to the next pixel (directly above the current pixel)
            targetIndex -= (bytesPerPixel * this.bufferCanvasPixels.width);                      
          }                                                              
        } 
      }       
        
      // TRACE THE NEXT RAY
      castArc+=1;
      if (castArc>=this.ANGLE360)
        castArc-=this.ANGLE360;
    }

  },
  
  // This function is called every certain interval (see this.frameRate) to handle input and render the screen
  update : function() 
  {
    if (gameData) {
      this.players = gameData["players"];
    }
    if (this.fKeyRun) {
      this.pSpeed = 9;
    } else {
      this.pSpeed = 4;
    }
    this.clearbufferCanvas();
    if (this.screen == SCREEN_MAP) {
      this.drawOverheadMap();
    } else {
      this.raycast();
    }
    this.blitbufferCanvas();
    var playerArcDelta=0;
    
    //console.log("update");
    if (this.fKeyLeft)
    {
      this.pAngle-=this.ANGLE5;
      playerArcDelta=-this.ANGLE5;
      if (this.pAngle<this.ANGLE0)
        this.pAngle+=this.ANGLE360;
    }
      // rotate right
    else if (this.fKeyRight)
    {
      this.pAngle+=this.ANGLE5;
      playerArcDelta=this.ANGLE5;
      if (this.pAngle>=this.ANGLE360)
        this.pAngle-=this.ANGLE360;
    }
    this.fBackgroundImageArc-=playerArcDelta;
    if (this.fBackgroundTextureBuffer!=undefined)
    {
      //console.log("this.pAngle="+this.pAngle+" this.fBackgroundImageArc="+this.fBackgroundImageArc);
      // This code wraps around the background image so that it can be drawn just one.
      // For this to work, the first section of the image needs to be repeated on the third section (see the image used in this example)
      if (this.fBackgroundImageArc<-this.PROJECTIONPLANEWIDTH*2)
        this.fBackgroundImageArc=this.PROJECTIONPLANEWIDTH*2+(this.fBackgroundImageArc);
      else if (this.fBackgroundImageArc>0)
        this.fBackgroundImageArc=-(this.fBackgroundTexture.width-this.PROJECTIONPLANEWIDTH- (this.fBackgroundImageArc));
    }   
    //  _____     _
    // |\ arc     |
    // |  \       y
    // |    \     |
    //            -
    // |--x--|  
    //
    //  sin(arc)=y/diagonal
    //  cos(arc)=x/diagonal   where diagonal=speed
    var playerXDir=this.fCosTable[this.pAngle];
    var playerYDir=this.fSinTable[this.pAngle];

    
    var dx=0;
    var dy=0;
    // move forward
    if (this.fKeyUp)
    {
      dx=Math.round(playerXDir*this.pSpeed);
      dy=Math.round(playerYDir*this.pSpeed);
    }
    // move backward
    else if (this.fKeyDown)
    {
      dx=-Math.round(playerXDir*this.pSpeed);
      dy=-Math.round(playerYDir*this.pSpeed);
    }
    this.pX+=dx;
    this.pY+=dy;
    
    // compute cell position
    var playerXCell = Math.floor(this.pX/this.TILE_SIZE);
    var playerYCell = Math.floor(this.pY/this.TILE_SIZE);

    // compute position relative to cell (ie: how many pixel from edge of cell)
    var playerXCellOffset = this.pX % this.TILE_SIZE;
    var playerYCellOffset = this.pY % this.TILE_SIZE;

    var minDistanceToWall=30;
    
    // make sure the player don't bump into walls
    if (dx>0)
    {
      // moving right
      if ((this.solids.includes(this.fMap.charAt((playerYCell*this.MAP_WIDTH)+playerXCell+1)))&&
        (playerXCellOffset > (this.TILE_SIZE-minDistanceToWall)))
      {
        // back player up
        this.pX-= (playerXCellOffset-(this.TILE_SIZE-minDistanceToWall));
      }               
    }
    else
    {
      // moving left
      if ((this.solids.includes(this.fMap.charAt((playerYCell*this.MAP_WIDTH)+playerXCell-1)))&&
        (playerXCellOffset < (minDistanceToWall)))
      {
        // back player up
        this.pX+= (minDistanceToWall-playerXCellOffset);
      } 
    } 

    if (dy<0)
    {
      // moving up
      if ((this.solids.includes(this.fMap.charAt(((playerYCell-1)*this.MAP_WIDTH)+playerXCell)))&&
        (playerYCellOffset < (minDistanceToWall)))
      {
        // back player up 
        this.pY+= (minDistanceToWall-playerYCellOffset);
      }
    }
    else
    {
      // moving down                                  
      if ((this.solids.includes(this.fMap.charAt(((playerYCell+1)*this.MAP_WIDTH)+playerXCell)))&&
        (playerYCellOffset > (this.TILE_SIZE-minDistanceToWall)))
      {
        // back player up 
        this.pY-= (playerYCellOffset-(this.TILE_SIZE-minDistanceToWall ));
      }
    }    
    
    if (this.fKeyLookUp)
    {
      this.fProjectionPlaneYCenter+=15;
    }
    else if (this.fKeyLookDown)
    {
      this.fProjectionPlaneYCenter-=15;
    }

    if (this.fProjectionPlaneYCenter<-this.PROJECTIONPLANEHEIGHT*1)
      this.fProjectionPlaneYCenter=-this.PROJECTIONPLANEHEIGHT*1;
    else if (this.fProjectionPlaneYCenter>=this.PROJECTIONPLANEHEIGHT*1.5)
      this.fProjectionPlaneYCenter=this.PROJECTIONPLANEHEIGHT*1.5-1;
      
    if (this.fKeyFlyUp)
    {
      this.pHeight+=1;
    }
    else if (this.fKeyFlyDown)
    {
      this.pHeight-=1;
    }

    if (this.pHeight<-5)
      this.pHeight=-5;
    else if (this.pHeight>this.WALL_HEIGHT-5)
      this.pHeight=this.WALL_HEIGHT-5;
    
    var object=this;
    
    // if (this.mouseMoving == false) {
      // this.fKeyLookUp = false;
      // this.fKeyLookDown = false;
      // this.fKeyRight = false;
      // this.fKeyLeft = false;
      // this.lastMousePosition = false;
    // }

    // this.mouseMoving = false;
    // Render next frame
    setTimeout(function() 
    {
      object.animationFrameID = requestAnimationFrame(object.update.bind(object));
    }, 1000 / this.frameRate);    
  },

  handleMouseMove: function(e)
  {
    if (e.target instanceof HTMLCanvasElement)
    {
      this.mouseMoving = true;
      if (this.lastMousePosition) {
        let direction = [0, 0];
        if (e.clientX > this.lastMousePosition.clientX)
        {
          direction[0] = 1;
          this.fKeyRight = true;
        }
        else if (e.clientX < this.lastMousePosition.clientX)
        {
          direction[0] = -1;
          this.fKeyLeft = true;
        }
        if (e.clientY > this.lastMousePosition.clientY)
        {
          direction[1] = -1;
          this.fKeyLookDown = true;
        }
        else if (e.clientY < this.lastMousePosition.clientY)
        {
          direction[1] = 1;
          this.fKeyLookUp = true;
        }
        console.log(direction);
      }
      this.lastMousePosition = e;
    }
  },

  handleKeyDown : function(e) 
  {

    if (!e)
      e = window.event;

    // UP keypad
    if (e.keyCode == '38'  || String.fromCharCode(e.keyCode) == 'W') 
    {
      this.fKeyUp = true;
    }
    // DOWN keypad
    else if (e.keyCode == '40' || String.fromCharCode(e.keyCode) == 'S') 
    {
      this.fKeyDown = true;
    }
    // LEFT keypad
    else if (e.keyCode == '37'  || String.fromCharCode(e.keyCode) == 'A') 
    {
       this.fKeyLeft = true;
    }
    // RIGHT keypad
    else if (e.keyCode == '39'  || String.fromCharCode(e.keyCode) == 'D') 
    {
       this.fKeyRight = true;
    }
    
    // LOOK UP
    else if (String.fromCharCode(e.keyCode) == 'Q') 
    {
       this.fKeyLookUp = true;
    }
    // LOOK DOWN
    else if (String.fromCharCode(e.keyCode) == 'Z') 
    {
       this.fKeyLookDown = true;
    }
    // FLY UP
    else if (String.fromCharCode(e.keyCode) == 'E') 
    {
       this.fKeyFlyUp = true;
    }
    // FLY DOWN
    else if (String.fromCharCode(e.keyCode) == 'C') 
    {
       this.fKeyFlyDown = true;
    }
    else if (e.keyCode == 16) 
    {
       this.fKeyRun = true;
    }
    else if (String.fromCharCode(e.keyCode) == 'M')
    {
      if (this.screen == SCREEN_MAP) {
        this.screen = SCREEN_GAME;
      }
      else
      {
        this.screen = SCREEN_MAP;
      }
    }
  },
  
  handleKeyUp : function(e) 
  {
    if (!e)
      e = window.event;

    // UP keypad
    if (e.keyCode == '38'  || String.fromCharCode(e.keyCode) == 'W') 
    {
      this.fKeyUp = false;

    }
    // DOWN keypad
    if (e.keyCode == '40' || String.fromCharCode(e.keyCode) == 'S') 
    {
      this.fKeyDown = false;
    }
    // LEFT keypad
    if (e.keyCode == '37'  || String.fromCharCode(e.keyCode) == 'A') 
    {
       this.fKeyLeft = false;
    }
    // RIGHT keypad
    if (e.keyCode == '39'  || String.fromCharCode(e.keyCode) == 'D') 
    {
       this.fKeyRight = false;
    }
    // LOOK UP
    else if (String.fromCharCode(e.keyCode) == 'Q') 
    {
       this.fKeyLookUp = false;
    }
    // LOOK DOWN
    else if (String.fromCharCode(e.keyCode) == 'Z') 
    {
       this.fKeyLookDown = false;
    } 
    // FLY UP
    else if (String.fromCharCode(e.keyCode) == 'E') 
    {
       this.fKeyFlyUp = false;
    }
    // FLY DOWN
    else if (String.fromCharCode(e.keyCode) == 'C') 
    {
       this.fKeyFlyDown = false;
    }
    else if (e.keyCode == 16) 
    {
       this.fKeyRun = false;
    }
  },
  
  start : function()
  {
    this.init();
    // window.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
    window.addEventListener("keydown", this.handleKeyDown.bind(this), false);
    window.addEventListener("keyup", this.handleKeyUp.bind(this), false);
    
    this.animationFrameID = requestAnimationFrame(this.update.bind(this));
  }

}

export { GameWindow }