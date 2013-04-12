({
    clickListener: {
    paramDefs: {
      graphics: null,
      selected: null,
      selectedPiece: null,
      draggedPiece: null,
      pieces: [],
      boxedPieces: [],
      mouse: null,
      leftMouseDown: false,
      constants: null
    },
    update: function() {

      var newLeftMouseDown = this.params.mouse.down && !this.params.leftMouseDown;
      var newLeftMouseReleased = !this.params.mouse.down && this.params.leftMouseDown;

      //copied from drawLight
      var that = this;
      var selected = this.params.selected;

      if(this.params.draggedPiece){
        this.params.graphics.shapes.push({
          type: "image",
          layer: "drag",
          asset: this.params.draggedPiece.type,
          alpha: 0.5,
          position: [-this.params.constants.pieceAssetCentering, -this.params.constants.pieceAssetCentering],
          translation: [this.params.mouse.position.x, this.params.mouse.position.y],
          rotation: this.params.draggedPiece.rotation // In degrees 
        });
      }

      //converts a pixel coordinate to a board coordinate
      //assumes that the board is made out of squares
      function toBoardCoordinate(pixelCoordinate)
      {
        var res = Math.floor((pixelCoordinate - that.params.constants.upperLeftBoardMargin)/that.params.constants.cellSize);
        console.log("toBoardCoordinates("+pixelCoordinate+")="+res+" with upperLeftBoardMargin="+that.params.constants.upperLeftBoardMargin+", pieceAssetCentering="+that.params.constants.pieceAssetCentering+", cellSize="+that.params.constants.cellSize);
        return res;
      }

      //copied from drawLight
      function findGridElement(square, data)
      {
        var gameData = data || that;
        for(var i in gameData.params.pieces)
        {
          var piece = gameData.params.pieces[i];
          //console.log("action.js: findGridElement: comparing point position ["+col+","+row+"] with ["+piece.col+","+piece.row+"]");
          if(piece.col == square[0] && piece.row == square[1]) return piece; 
        }
        console.log("action.js: findGridElement: no piece found");
        return null;
      }

      //moves a piece from the board to another square on the board
      //@piece: if on board has attributes "type", "col", "row" and "rotation"; if in box: has attributes "type" and "index"
      //@srcData is useful only when a piece is moved from or into the box
      //which is determined by examining the attributes of "piece"
      function movePieceTo(piece, newSquare, srcData)
      {
        if (piece && isOnBoard(newSquare)) {
          console.log("action.js: movePieceTo: "+piece.type+" on ["+piece.col+","+piece.row+"] to ["+newSquare[0]+","+newSquare[1]+"]");
          var movedPiece = findGridElement([piece.col, piece.row]);
          if(movedPiece) { //the piece was on the board, let's change its coordinates
            movedPiece.col = newSquare[0];
            movedPiece.row = newSquare[1];
          } else { //the piece was in the box, let's put it on the board
            //remove the piece from the "boxedPieces"
            takePieceOutOfBox(piece.type, srcData.params.boxedPieces);

            //add it to the "pieces" with the appropriate coordinates
            var insertedPiece = {
              "col": newSquare[0],
              "row": newSquare[1],
              "type": piece.type,
              "rotation": 0
            };
            srcData.params.pieces.push(insertedPiece);
          }
        }
      }

      //removes a piece form the boxed pieces and rearranges the remaining pieces
      function takePieceOutOfBox(pieceType, boxedPieces) {
        for(var i in boxedPieces)
        {
          var piece = boxedPieces[i];
          if(piece.type == pieceType) {
            boxedPieces.splice(i, 1);
            return;
          }
        }
      }

      //TODO remove
      function takePieceOutOfBox2(pieceIndex, srcData) {
        srcData.params.boxedPieces.splice(pieceIndex, 1);
      }

      function putPieceIntoBox(piece, srcData) {
        var newIndex = srcData.params.boxedPieces.length;
        var boxedPiece = {
          "type": piece.type,
          "index": newIndex
        };
        //srcData.params.boxedPieces.splice(newIndex, 0, boxedPiece);
        srcData.params.boxedPieces.push(boxedPiece);

        var index = srcData.params.pieces.indexOf(piece);
        srcData.params.pieces.splice(index, 1);
      }

      //selects a square if it is on the board
      function selectSquare(square)
      {
        if(isOnBoard(square)) {
          selected.col = square[0];
          selected.row = square[1];
        }
      }

      //returns the coordinates of the square that was clicked on in the box, or null if outside of the box
      //@position: array of coordinates in pixels
      function getIndexInBox(position) {
        var boxLeft = 837;
        var boxRight = 935;
        var boxTop = 284;
        var boxBottom = 514;
        if ((position[0] > boxLeft) && (position[0] < boxRight) && (position[1] > boxTop) && (position[1] < boxBottom)) {
          return 0;
        }
        return null;
      }

      //updates selected piece and dragged piece when the mouse button is pressed on a piece
      function mouseDownOnPiece(piecePressed, data) {
        var gameData = data || that;
        if(piecePressed) {
          console.log("action.js: clicked on piece of type \""+piecePressed.type+"\"");
          console.log("action.js: the previously selected piece is unselected");
          gameData.params.selectedPiece = null;

          console.log("action.js: \""+piecePressed.type+"\" starts to be dragged, even if a piece was already being dragged");
          gameData.params.draggedPiece = piecePressed;
        }
      }

      //tests whether a given position is inside the board or not
      //@positionOnBoard: array of coordinates as column and row position
      function isOnBoard(positionOnBoard) {
        return ((positionOnBoard[0] <= 13) && (positionOnBoard[0] >= 0) && (positionOnBoard[1] <= 8) && (positionOnBoard[1] >= 0));
      }

      if(newLeftMouseDown || newLeftMouseReleased) {
        if(that.params.mouse.position)
        {
          //board coordinates
          var clickedColumn = toBoardCoordinate(that.params.mouse.position.x);
          var clickedRow = toBoardCoordinate(that.params.mouse.position.y);
          var boardCoordinates = [clickedColumn, clickedRow];

          //test whether there is a piece or not
          if (newLeftMouseDown)
          {
            console.log("action.js: newLeftMouseDown");

            //set mouse button flag
            this.params.leftMouseDown = true;

            if(!isOnBoard(boardCoordinates)){
              var boxIndex = getIndexInBox([that.params.mouse.position.x, that.params.mouse.position.y]);
              //check whether the click happened in the box or not
              if(boxIndex !== null) {
                //clicked in box
                var boxedPiece = this.params.boxedPieces[boxIndex];
                var pieceType = null;
                if(boxedPiece) {
                  pieceType = boxedPiece.type;
                }
                console.log("clicked in box at position "+boxIndex+" on piece of type \""+pieceType+"\"");
                mouseDownOnPiece(boxedPiece, this);
              } // else clicked outsite of the box, out of the board: nothing to be done
            } else { //clicked on board
              //let's select the square that has been clicked on
              selectSquare([clickedColumn, clickedRow]);
              var pieceClickedOn = findGridElement(boardCoordinates);
              mouseDownOnPiece(pieceClickedOn, this);
            }

          } else if (newLeftMouseReleased) {
            console.log("action.js: newLeftMouseReleased");
            
            //reset mouse button flag
            this.params.leftMouseDown = false;

            if(!isOnBoard(boardCoordinates)){
              //dragged out of board: put piece in box
                if(this.params.selectedPiece) {
                  putPieceIntoBox(that.params.selectedPiece, this);
                  this.params.draggedPiece = null;
                  this.params.selectedPiece = null;
                } else if(this.params.draggedPiece) {
                  putPieceIntoBox(that.params.draggedPiece, this);
                  this.params.draggedPiece = null;
                  this.params.selectedPiece = null;
                }
            } else {
              //dragged on board: check if square is empty, then move piece

              //let's select the square that has been clicked on
              //selectSquare([clickedColumn, clickedRow]);

              //test whether there is a piece or not
              var pieceReleasedOn = findGridElement(boardCoordinates);
              if (pieceReleasedOn) {
                console.log("action.js: released on piece of type \""+pieceReleasedOn.type+"\"");
                console.log("action.js: drag and drop fails: undrag piece");
                
                if(!this.params.draggedPiece && !this.params.selectedPiece) {
                  this.params.selectedPiece = pieceReleasedOn;
                } else {
                  this.params.selectedPiece = null;
                }
                this.params.draggedPiece = null;

              } else {
                if(this.params.selectedPiece) {
                  console.log("action.js: position piece on ["+clickedColumn+","+clickedRow+"] if one was selected");
                  movePieceTo(this.params.selectedPiece, [clickedColumn, clickedRow], this);
                  this.params.selectedPiece = null;
                } else if (this.params.draggedPiece) {
                  console.log("action.js: position piece on ["+clickedColumn+","+clickedRow+"] if one was being dragged");
                  movePieceTo(this.params.draggedPiece, [clickedColumn, clickedRow], this);
                  this.params.draggedPiece = null;
                  this.params.selectedPiece = null;
                }
              }
            }
          }
        }
      }
    }
  },

  clearBackground: {
    paramDefs: {
      "color": "black",
      "graphics": null
    },
    update: function() {
      this.params.graphics.shapes.push({
        type: "rectangle",
        layer: "bg",
        fillStyle: this.params.color,
        position: [0, 0],
        size: this.params.graphics.size
      });
    }
  },

  drawImage: {
    paramDefs: {
      graphics: null,
      image: null,
      x: 0,
      y: 0
    },
    update: function() {
      this.params.graphics.shapes.push({
        type: "image",
        layer: "bg",
        asset: this.params.image,
        position: [this.params.x, this.params.y]
      });
    }
  },

  drawText: {
    paramDefs: {
      text: "",
      x: 0,
      y: 12,
      style: "black",
      font: "12px Arial",
      "graphics": null
    },
    update: function() { 
      this.params.graphics.shapes.push({
        type: "text",
        layer: "text",
        text: this.params.text,
        style: this.params.style,
        font: this.params.font,
        position: [this.params.x, this.params.y]
      });
    }
  },

  group: { 
    doc: "Just to place children under it"
  },

  drawPiece: {
    paramDefs: {
      graphics: null,
      type: null,
      row: 0,
      col: 0,
      rotation: 0,
      constants: null
    },

    update: function() {
      this.params.graphics.shapes.push({
        type: "image",
        layer: "pieces",
        asset: this.params.type,
        position: [-this.params.constants.pieceAssetCentering, -this.params.constants.pieceAssetCentering],
        translation: [this.params.col * this.params.constants.cellSize + this.params.constants.upperLeftBoardMargin + this.params.constants.pieceAssetCentering, 
          this.params.row * this.params.constants.cellSize + this.params.constants.upperLeftBoardMargin + this.params.constants.pieceAssetCentering],
        rotation: this.params.rotation // In degrees 
      });
    }
  },

  // draws a boxed piece in the box according to its index in the "boxedPiece" table
  drawBoxedPiece: {
    paramDefs: {
      graphics: null,
      type: null,
      index: 0,
      constants: null
    },
    update: function() {
      //var offset = [862, 308];
      var offset = [837, 284];
      var cellSize = [49, 46];
      var boxPosition = [this.params.index % 2, this.params.index >> 1];
      this.params.graphics.shapes.push({
        type: "image",
        layer: "pieces",
        asset: this.params.type,
        scale: 0.67,
        position: [-this.params.constants.pieceAssetCentering, -this.params.constants.pieceAssetCentering],
        translation: [offset[0] + (boxPosition[0]+.5) * cellSize[0], offset[1] + (boxPosition[1]+.5) * cellSize[1]],
        rotation: 0 // In degrees 
      });
    }
  },

  drawSelected: {
    paramDefs: {
      graphics: null,
      row: 0,
      col: 0,
      constants: null
    },
    update: function() {
      this.params.graphics.shapes.push({
        type: "rectangle",
        layer: "selection",
        position: [this.params.col * this.params.constants.cellSize + this.params.constants.upperLeftBoardMargin, 
        this.params.row * this.params.constants.cellSize + this.params.constants.upperLeftBoardMargin],
        size: [50, 50],
        strokeStyle: "yellow",
        lineWidth: 4
      });
    }
  },

  incrementNumber: {
    paramDefs: {
      number: 0
    },
    update: function() {
      this.params.number++;
    }
  },

  drawLight: {
    paramDefs: {
      graphics: null,
      pieces: [],
      constants: null
    },
    update: function() {

      var that = this;
      var gridSize = that.params.constants.gridSize;


      function isInGrid(point)
      {
        return point[0] >= 0 && point[0] < gridSize[0] && point[1] >= 0 && point[1] < gridSize[1];        
      }

      // Attempts to find intersection with the given lines and returns it.
      // Else returns null.
      function findIntersection(origin, dest, lines)
      {
        var intersection = null;
        for(var i = 0; i < lines.length; i++)
        {
          intersection = Line.Segment.create(origin, dest).intersectionWith(Line.Segment.create(lines[i][0], lines[i][1]));
          if(intersection) return intersection.elements.slice(0, 2); // return only 2D part
        }

        return null;
      }

      // Returns an intersection point with walls, or null otherwise
      function intersectsBoundaries(origin, dest)
      {
        var boundaries = 
        [
          [[0, 0], [gridSize[0], 0]], // top
          [[gridSize[0], 0], [gridSize[0], gridSize[1]]], // right
          [[gridSize[0], gridSize[1]], [0, gridSize[1]]], // bottom
          [[0, gridSize[1]], [0, 0]] // left
        ];

        return findIntersection(origin, dest, boundaries);
      }

      // Returns an intersection point with walls, or null otherwise
      function intersectsCell(origin, dest, cellPos)
      {
        var boundaries = 
        [
          [[cellPos[0], cellPos[1]], [cellPos[0], cellPos[1] + 1]], // top
          [[cellPos[0], cellPos[1] + 1], [cellPos[0] + 1, cellPos[1] + 1]], // right
          [[cellPos[0] + 1, cellPos[1] + 1], [cellPos[0] + 1, cellPos[1]]], // bottom
          [[cellPos[0] + 1, cellPos[1]], [cellPos[0], cellPos[1]]] // left
        ];

        return findIntersection(origin, dest, boundaries);
      }

      function findGridElement(point)
      {
        for(var i in that.params.pieces)
        {
          var piece = that.params.pieces[i];
          if(piece.col == Math.floor(point[0]) && piece.row == Math.floor(point[1])) return piece; 
        }
        return null;
      }

      function handleGridElement()
      {
        if(element.type == "wall")
        {
          // find intersection with wall
          var wallIntersection = intersectsCell(lightSegments[lightSegments.length - 1].origin, origin, [element.col, element.row]);
          if(wallIntersection == null) throw new Error("Cannot find intersection with wall");
          lightSegments[lightSegments.length - 1].destination = wallIntersection;

          lightIntensity = 0;
        }
        else if(element.type == "mirror")
        {
          // find intersection with central line
          // HACK: adding 90 degrees to rotation seems to work, but doesn't seem necessary
          var rotation = (element.rotation + 90) * Math.PI / 180; 
          var centralLineDiff = [.5 * Math.cos(rotation), .5 * Math.sin(rotation)];
          var centralLine = [[element.col + 0.5 + centralLineDiff[0], element.row + 0.5 + centralLineDiff[1]], [element.col + 0.5 - centralLineDiff[0], element.row + 0.5 - centralLineDiff[1]]];
          var lineDestination = Vector.create(origin).add(Vector.create(lightDirection));
          if(intersection = findIntersection(lightSegments[lightSegments.length - 1].origin, lineDestination.elements, [centralLine]))
          {
            lightSegments[lightSegments.length - 1].destination = intersection;

            lightIntensity *= that.params.constants.mirrorAttenuationFactor;
            if(lightIntensity < that.params.constants.minimumAttenuation)
            {
              lightIntensity = 0;
            }
            else
            {
              lightSegments.push({ origin: intersection, intensity: lightIntensity });

              // reflect around normal (from http://www.gamedev.net/topic/510581-2d-reflection/)
              // v' = 2 * (v . n) * n - v;
              var normal = Vector.create([-Math.sin(rotation), Math.cos(rotation)]);
              var oldLightDirection = Vector.create(lightDirection);
              lightDirection = normal.multiply(2 * oldLightDirection.dot(normal)).subtract(oldLightDirection).elements;

              updateLightDirection();
            }
          }
        }
      }

      function updateLightDirection()
      {
        d = [Math.abs(lightDirection[0]), Math.abs(lightDirection[1])];
        s = [lightDirection[0] > 0 ? 1 : -1, lightDirection[1] > 0 ? 1 : -1];
        err = d[0] - d[1];
      }

      // all lines are in grid space, not in screen space
      // options override default values for all drawn shapes (layer, composition, etc.)
      function drawGradientLine(origin, dest, innerRadius, outerRadius, colorRgba, options)
      {
        var marginV = Vector.create([that.params.constants.toSquareCenterOffset, that.params.constants.toSquareCenterOffset]);

        // find normal to line (http://stackoverflow.com/questions/1243614/how-do-i-calculate-the-normal-vector-of-a-line-segment)
        var originV = Vector.create(origin).multiply(that.params.constants.cellSize).add(marginV);
        var destV = Vector.create(dest).multiply(that.params.constants.cellSize).add(marginV);
        var d = destV.subtract(originV);
        var normal = Vector.create([-d.elements[1], d.elements[0]]).toUnitVector();

        var strokeGradUpper = originV.add(normal.multiply(outerRadius));
        var strokeGradLower = originV.add(normal.multiply(-outerRadius));

        var transRgba = _.clone(colorRgba);
        transRgba[3] = 0;

        strokeGrad = {
          type: "linearGradient",
          startPosition: strokeGradUpper.elements,
          endPosition: strokeGradLower.elements,
          colorStops: [
            { position: 0, color: "rgba(" + transRgba.join(",") + ")" },
            { position: innerRadius / outerRadius, color: "rgba(" + colorRgba.join(",") + ")" },
            { position: 1 - innerRadius / outerRadius, color: "rgba(" + colorRgba.join(",") + ")" },
            { position: 1, color: "rgba(" + transRgba.join(",") + ")" }
          ]
        };

        that.params.graphics.shapes.push(_.extend({
          type: "path",
          layer: "light",
          strokeStyle: strokeGrad,
          lineWidth: 2 * outerRadius,
          points: [originV.elements, destV.elements]
        }, options));

        fillGrad = {
          type: "radialGradient",
          start: {
            position: originV.elements,
            radius: 0
          },
          end: {
            position: originV.elements,
            radius: outerRadius
          },
          colorStops: [
            { position: innerRadius / outerRadius, color: "rgba(" + colorRgba.join(",") + ")" },
            { position: 1, color: "rgba(" + transRgba.join(",") + ")" }
          ]
        };

        that.params.graphics.shapes.push(_.extend({
          type: "circle",
          layer: "light",
          fillStyle: fillGrad,
          position: originV.elements,
          radius: outerRadius
        }, options));

        fillGrad = {
          type: "radialGradient",
          start: {
            position: destV.elements,
            radius: 0
          },
          end: {
            position: destV.elements,
            radius: outerRadius
          },
          colorStops: [
            { position: innerRadius / outerRadius, color: "rgba(" + colorRgba.join(",") + ")" },
            { position: 1, color: "rgba(" + transRgba.join(",") + ")" }
          ]
        };

        that.params.graphics.shapes.push(_.extend({
          type: "circle",
          layer: "light",
          fillStyle: fillGrad,
          position: destV.elements,
          radius: outerRadius
        }, options));
      }

      // Do everything in the "grid space" and change to graphic coordinates at the end

      // find source of light
      // TODO: this could be replacd by a WHERE bind expression
      var lightSource;
      for(var i in this.params.pieces)
      {
        var piece = this.params.pieces[i];
        if(piece.type == "laser-on") 
        {
          lightSource = piece;
          break;
        }
      }
      if(!lightSource) return;

      // calculate origin coordinates of light 
      // the piece starts vertically, so we rotate it 90 degrees clockwise by default
      var rotation = (lightSource.rotation - 90) * Math.PI / 180; 
      var lightDirection = [Math.cos(rotation), Math.sin(rotation)];
      // TODO: add color portions of light (3 different intensities)
      var lightIntensity = 1.0; // start at full itensity

      // follow light path through the grid, checking for intersections with pieces
      // Based on Bresenham's line algorithm (http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm)      
      var d, s, r;
      updateLightDirection();

      var origin = [lightSource.col + .5, lightSource.row + .5]

      var lightSegments = [ { origin: [origin[0], origin[1]], intensity: lightIntensity }];
      var element;
      do
      { 
        var err2 = 2 * err;
        if(err2 > -d[1]) {
          err = err - d[1];
          origin[0] += s[0]
        }
        if(err2 < d[0]) {
          err = err + d[0];
          origin[1] += s[1]
        }

        if(!isInGrid(origin)) 
        {
          lightIntensity = 0;

          // find intersection with boundaries
          var boundaryIntersection = intersectsBoundaries(lightSegments[lightSegments.length - 1].origin, origin);
          if(boundaryIntersection == null) throw new Error("Cannot find intersection with boundaries");
          lightSegments[lightSegments.length - 1].destination = boundaryIntersection;
        }
        else if(element = findGridElement(origin))
        {
          handleGridElement();
        }
      } while(lightIntensity > 0);

      // DRAW SEGMENTS

      // Draw black mask that we will cut away from
      // based on the method of this fiddle: http://jsfiddle.net/wNYkX/3/
      that.params.graphics.shapes.push({
        type: "rectangle",
        layer: "mask",
        fillStyle: "black",
        position: this.params.constants.playableBoardOffset,
        size: this.params.constants.playableBoardSize,
        order: 0
      });

      // now cut away, using 'destination-out' composition
      var maskOptions = { 
        layer: "mask", 
        composition: "destination-out", 
        order: 1 
      };
      for(var i = 0; i < lightSegments.length; i++)
      {
        //TODO extract 30 and 40 values
        drawGradientLine(lightSegments[i].origin, lightSegments[i].destination, 30, 40, [255, 255, 255, lightSegments[i].intensity], maskOptions);
      }

      // draw light ray normally
      for(var i = 0; i < lightSegments.length; i++)
      {
        //TODO extract 4 and 6 values
        drawGradientLine(lightSegments[i].origin, lightSegments[i].destination, 4, 6, [255, 0, 0, lightSegments[i].intensity]);
      }
    }
  },

  rotateSelectedPiece: {
    paramDefs: {
      "selected": null,
      "pieces": [],
      "keyboard": null,
      "constants": null
    },
    update: function() {
      var that = this;
      function findGridElement(point)
      {
        for(var i in that.params.pieces)
        {
          var piece = that.params.pieces[i];
          if(piece.col == Math.floor(point[0]) && piece.row == Math.floor(point[1])) return piece; 
        }
        return null;
      }

      var selectedPiece = findGridElement([this.params.selected.col, this.params.selected.row]);
      if(!selectedPiece) return; // nothing selected, so can't rotate


      var keysDown = this.params.keyboard.keysDown; // alias
      if(keysDown[37]) { // left
        selectedPiece.rotation -= this.params.constants.rotationAmount;
      } else if(keysDown[39]) { // right
        selectedPiece.rotation += this.params.constants.rotationAmount;
      }
    }
  }
});