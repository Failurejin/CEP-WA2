
let G = 0.5;//G
let K = 5.0;//Coulombs consant
let movers = [];
let vectorfield = true;
let gravityField = true; 
let positive = true;
let neutral = false;
const SPEED_OF_LIGHT = 15.0; 

//camera parameters
let offsetx = 0;
let offsety = 0;
let zoom = 1.0;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SPEED = 10; 

//interaction status
let lockedTarget = null; 
let draggedTarget = null; 
let isNewlyLocked = false; 

//object count
let count = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  movers.push(new Mover(10, 5, 400, 300));
  movers.push(new Mover(8, -4, 600, 300));
  movers.push(new Mover(15, 0, 500, 400));
  count = 3;
}

function draw() {
  background(30); 

  cameraTracking();

  //render space
  push();
  translate(width / 2, height / 2);
  scale(zoom);
  translate(-width / 2 + offsetx, -height / 2 + offsety);

  if (gravityField) drawGravityField();
  if (vectorfield) drawVectorField();

  //physics loop
  for (let i = movers.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      let m1 = movers[i];
      let m2 = movers[j];

      let fToM2 = m1.calculateCombinedForce(m2);
      m2.applyForce(fToM2);
      let fToM1 = m2.calculateCombinedForce(m1);
      m1.applyForce(fToM1);

      if (m1.collisions(m2)) {
        let newMass = m1.mass + m2.mass;
        let newCharge = m1.q + m2.q;
        
        let m1Factor = m1.mass;
        let m2Factor = m2.mass;
        let newVel = p5.Vector.add(p5.Vector.mult(m1.velocity, m1Factor), p5.Vector.mult(m2.velocity, m2Factor)).div(newMass);
        let newX = (m1.position.x * m1.mass + m2.position.x * m2.mass) / newMass;
        let newY = (m1.position.y * m1.mass + m2.position.y * m2.mass) / newMass;

        let merged = new Mover(newMass, newCharge, newX, newY);
        merged.velocity = newVel;

        merged.history = [...m1.history, ...m2.history].sort((a,b) => movers.indexOf(m1) - movers.indexOf(m2)).slice(-15);

        if (lockedTarget === m1 || lockedTarget === m2) {
          lockedTarget = merged;
        }
        if (draggedTarget === m1 || draggedTarget === m2) {
          draggedTarget = merged;
        }

        movers.splice(i, 1);
        movers.splice(j, 1);
        movers.push(merged);
        count--;
        break;
      }
    }
  }

  //relativistic calculation
  for (let mover of movers) {
    let dt = 1.0; 

    if (lockedTarget) {
      if (mover === lockedTarget) {
        dt = 1.0; 
      } else {
        let relVel = p5.Vector.sub(mover.velocity, lockedTarget.velocity);
        let v = relVel.mag();
        if (v < SPEED_OF_LIGHT) {
          dt = sqrt(1.0 - (v * v) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT));
        } else {
          dt = 0.001; 
        }
      }
    } else {
      let v = mover.velocity.mag();
      if (v < SPEED_OF_LIGHT) {
        dt = sqrt(1.0 - (v * v) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT));
      } else {
        dt = 0.001;
      }
    }

    mover.update(dt); 
    mover.displayTrail(); 
    mover.display();
  }
  pop(); 

  user_interaction();
  drawHUD();
  drawObjectMenu();
}

function cameraTracking() {
  if (lockedTarget) {
    if (!movers.includes(lockedTarget)) {
      lockedTarget = null;
      return;
    }
    offsetx = width / 2 - lockedTarget.position.x;
    offsety = height / 2 - lockedTarget.position.y;

    if (isNewlyLocked) {
      let targetPaddingSize = lockedTarget.r * 6; 
      let targetZoom = min(width, height) / targetPaddingSize;
      targetZoom = constrain(targetZoom, 0.01, 5.0);
      
      zoom = lerp(zoom, targetZoom, 0.2);
      if (abs(zoom - targetZoom) < 0.01) {
        zoom = targetZoom;
        isNewlyLocked = false;
      }
    }
  }
}

function drawHUD() {
  push();
  fill('white');
  textAlign(CENTER);
  textSize(12);
  text("Count: " + count + " | Drag objects to manipulate | Arrows: Pan | Scroll: Zoom | '+/-': Scale Forces | 'S': Vector Field | 'G': Gravity Warp | 'P': Toggle | 'N': Neutral | 'B': blackhole | 'R': Reset", width / 2, 30);
  
  let modeText = positive ? "Current: POSITIVE (+)" : "Current: NEGATIVE (-)";
  fill(positive ? 'red' : 'blue');
  if (neutral){
    modeText = "Current: Neutral (0)";
    fill('grey');
  }
  text(modeText, width / 2, 50);

  fill(0, 230, 255);
  let frameStatus = lockedTarget ? `FRAME OF REFERENCE: Object Rest Frame (c = ${SPEED_OF_LIGHT})` : `FRAME OF REFERENCE: Static Lab Frame (c = ${SPEED_OF_LIGHT})`;
  text(frameStatus, width / 2, 70);
  
  fill(255, 200, 0);
  
  let displayTimeFlow = 100;
  if (lockedTarget) {
    displayTimeFlow = 100; 
  } else {
    if (movers.length > 0) {
      let totalDilation = 0;
      for (let m of movers) {
        let v = m.velocity.mag();
        let dt = v < SPEED_OF_LIGHT ? sqrt(1.0 - (v * v) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT)) : 0.001;
        totalDilation += dt;
      }
      displayTimeFlow = (totalDilation / movers.length) * 100;
    }
  }

  let lockStatus = lockedTarget 
    ? `TRACKING Target (Mass: ${lockedTarget.mass.toFixed(1)}) | Local Time Flow: ${displayTimeFlow.toFixed(0)}%` 
    : `CAMERA: Manual Control (Lab Observer) | Mean System Time Flow: ${displayTimeFlow.toFixed(0)}%`;
  text(lockStatus, width / 2, 90);
  pop();
}

function drawObjectMenu() {
  let menuWidth = 230;
  let maxRenderedItems = min(movers.length, floor((height - 60) / 35));
  let dynamicHeight = 40 + maxRenderedItems * 35;

  push();
  fill(45, 45, 45, 220);
  stroke(60);
  rect(10, 10, menuWidth, dynamicHeight, 5);
  
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  text("Track Objects & Local Time:", 20, 20);
  
  textSize(11);
  for (let i = 0; i < movers.length; i++) {
    let m = movers[i];
    let yPos = 45 + i * 35;
    
    if (yPos > height - 40) {
      text(`...and ${movers.length - i} more`, 20, yPos);
      break;
    }

    if (lockedTarget === m) {
      fill(0, 150, 255, 30);
      rect(15, yPos - 3, menuWidth - 10, 30, 4);
    }

    let type = m.q === 0 ? "Neut" : (m.q > 0 ? "Pos" : "Neg");
    if (m.mass > 5000) type = "B-Hole";

    let localTimeFlow = 1.0;
    if (lockedTarget) {
      let relVel = p5.Vector.sub(m.velocity, lockedTarget.velocity);
      localTimeFlow = sqrt(max(0, 1.0 - (relVel.magSq() / (SPEED_OF_LIGHT * SPEED_OF_LIGHT))));
    } else {
      localTimeFlow = sqrt(max(0, 1.0 - (m.velocity.magSq() / (SPEED_OF_LIGHT * SPEED_OF_LIGHT))));
    }

    fill(m.q === 0 ? 180 : (m.q > 0 ? [255, 100, 100] : [100, 150, 255]));
    text(`[${type}] M:${int(m.mass)} Clock: ${(localTimeFlow * 100).toFixed(0)}%`, 20, yPos);
    
    let velMag = m.velocity.mag();
    let velocityDisplay = "";
    if (velMag >= 0.01 * SPEED_OF_LIGHT) {
      let fractionOfC = velMag / SPEED_OF_LIGHT;
      velocityDisplay = fractionOfC.toFixed(2) + "c";
    } else {
      velocityDisplay = velMag.toFixed(1);
    }

    fill(200);
    text(`V:${velocityDisplay} X:${int(m.position.x)} Y:${int(m.position.y)}`, 20, yPos + 12);
  }
  pop();
}

function getWarpedPosition(x, y) {
  let pos = createVector(x, y);
  let totalDisplacement = createVector(0, 0);

  for (let m of movers) {
    let toMover = p5.Vector.sub(m.position, pos);
    let d = toMover.mag();
    
    if (d > 10) {
      let warpStrength = (m.mass * G * 45) / (d + 20);
      warpStrength = min(warpStrength, d - 2); 
      let displacement = toMover.copy().setMag(warpStrength);
      totalDisplacement.add(displacement);
    }
  }
  return p5.Vector.add(pos, totalDisplacement);
}

function drawGravityField() {
  let startX = (0 - width / 2) / zoom + width / 2 - offsetx;
  let endX = (width - width / 2) / zoom + width / 2 - offsetx;
  let startY = (0 - height / 2) / zoom + height / 2 - offsety;
  let endY = (height - height / 2) / zoom + height / 2 - offsety;

  let spacing = 35 / zoom;
  let step = spacing < 15 ? 4 : (spacing < 25 ? 2 : 1);
  let res = spacing * step;

  startX = startX - (startX % res) - res;
  endX = endX + res;
  startY = startY - (startY % res) - res;
  endY = endY + res;

  stroke(50, 80, 70, 90); 
  strokeWeight(1 / zoom);
  noFill();

  for (let x = startX; x < endX; x += res) {
    beginShape();
    for (let y = startY; y < endY; y += 15 / zoom) {
      let warped = getWarpedPosition(x, y);
      vertex(warped.x, warped.y);
    }
    endShape();
  }

  for (let y = startY; y < endY; y += res) {
    beginShape();
    for (let x = startX; x < endX; x += 15 / zoom) {
      let warped = getWarpedPosition(x, y);
      vertex(warped.x, warped.y);
    }
    endShape();
  }
}

function drawVectorField() {
  let startX = (0 - width / 2) / zoom + width / 2 - offsetx;
  let endX = (width - width / 2) / zoom + width / 2 - offsetx;
  let startY = (0 - height / 2) / zoom + height / 2 - offsety;
  let endY = (height - height / 2) / zoom + height / 2 - offsety;

  let res = 50 / zoom; 

  for (let x = startX - (startX % res); x < endX; x += res) {
    for (let y = startY - (startY % res); y < endY; y += res) {
      let pos = createVector(x, y);
      let netForce = createVector(0, 0);

      for (let m of movers) {
        let diff = p5.Vector.sub(m.position, pos);
        let d = constrain(diff.mag(), 20, 500);
        let gS = (G * m.mass) / (d * d);
        let eS = (K * m.q) / (d * d);
        let forceVec = diff.copy().setMag(gS - eS);
        netForce.add(forceVec);
      }
      drawFieldArrow(pos, netForce, res * 0.6);
    }
  }
}

function drawFieldArrow(pos, v, maxL) {
  let mag = v.mag();
  if (mag < 0.0001) return;
  let len = map(mag, 0, 0.5, 2, maxL);
  len = constrain(len, 2, maxL);
  push();
  translate(pos.x, pos.y);
  rotate(v.heading());
  strokeWeight(1 / zoom); 
  stroke(100, 150, 255, 120);
  line(0, 0, len, 0);
  line(len, 0, len - (2/zoom), - (2/zoom));
  line(len, 0, len - (2/zoom), (2/zoom));
  pop();
}

function mousePressed() {
  let menuWidth = 230;
  let maxRenderedItems = min(movers.length, floor((height - 60) / 35));
  let dynamicHeight = 40 + maxRenderedItems * 35;

  //check click on object menu
  if (mouseX > 10 && mouseX < 10 + menuWidth && mouseY > 10 && mouseY < 10 + dynamicHeight) {
    for (let i = 0; i < movers.length; i++) {
      let yPos = 45 + i * 35;
      if (mouseY > yPos - 3 && mouseY < yPos + 27) {
        if (lockedTarget === movers[i]) {
          lockedTarget = null;
        } else {
          lockedTarget = movers[i];
          isNewlyLocked = true; 
        }
        return; 
      }
    }
    return; 
  }

  //calculate transformed coordinate
  let worldX = (mouseX - width / 2) / zoom + width / 2 - offsetx;
  let worldY = (mouseY - height / 2) / zoom + height / 2 - offsety;
  let mouseWorldPos = createVector(worldX, worldY);

  //check drag
  let clickedObject = null;
  for (let m of movers) {
    let d = p5.Vector.dist(mouseWorldPos, m.position);
    if (d < m.r) {
      clickedObject = m;
      break; 
    }
  }

  if (clickedObject) {
    draggedTarget = clickedObject;
  } else {
    // If clicking on empty space, spawn a new object
    let val = random(2, 10);
    if (neutral){
      movers.push(new Mover(val, 0, worldX, worldY));
    } else {
      if (positive) {
        movers.push(new Mover(val, val, worldX, worldY));
      } else {
        movers.push(new Mover(val, -val, worldX, worldY));
      }
    }
    count++;
  }
}

function mouseReleased() {
  //clear drag
  draggedTarget = null;
}

function user_interaction(){
  if (keyIsDown(LEFT_ARROW))  { lockedTarget = null; offsetx += PAN_SPEED / zoom; }
  if (keyIsDown(RIGHT_ARROW)) { lockedTarget = null; offsetx -= PAN_SPEED / zoom; }
  if (keyIsDown(UP_ARROW))    { lockedTarget = null; offsety += PAN_SPEED / zoom; }
  if (keyIsDown(DOWN_ARROW))  { lockedTarget = null; offsety -= PAN_SPEED / zoom; } 
}

function keyPressed(){
  let worldX = (mouseX - width / 2) / zoom + width / 2 - offsetx;
  let worldY = (mouseY - height / 2) / zoom + height / 2 - offsety;
  if (key === 's') vectorfield = !vectorfield; 
  if (key === 'g') gravityField = !gravityField; 
  if (key === 'p') positive = !positive;
  if (key === 'n') neutral = !neutral;
  if (key === '=' || key === '+') { G *= 1.1; K *= 1.1; }
  if (key === '-' || key === '_') { G *= 0.9; K *= 0.9; }
  if (key === 'b'){
    let worldX = (mouseX - width / 2) / zoom + width / 2 - offsetx;
    let worldY = (mouseY - height / 2) / zoom + height / 2 - offsety;
    movers.push(new Mover(10**4, 0, worldX, worldY));
    count++;
  }
  if (key === 'r') {
    movers = [];
    lockedTarget = null; 
    draggedTarget = null;
    count = 0;
    offsetx = 0;
    offsety = 0;
    zoom = 1.0;
  }
  if (key === 'o') {
    let m = 200;      
    let dist = 150;   
    let vOrbit = sqrt((G * (m + m)) / dist) / 2; 

    let s1 = new Mover(m, 0, worldX - dist/2, worldY);
    s1.velocity = createVector(0, vOrbit);
    
    let s2 = new Mover(m, 0, worldX + dist/2, worldY);
    s2.velocity = createVector(0, -vOrbit);

    movers.push(s1, s2);
    count += 2;
  }
}

function mouseWheel(e) {
  if (lockedTarget) {
    isNewlyLocked = false; 
  }
  zoom = constrain(zoom - e.delta * ZOOM_SENSITIVITY, 0.00001, 100); 
  return false; 
}
