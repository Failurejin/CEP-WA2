class Mover {
  constructor(m, q, x, y) {
    this.mass = abs(m) + 0.1; 
    this.q = q;
    
    this.r = sqrt(this.mass) * 10; 
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0); 
    
    this.history = [];
    this.maxTrailLength = 20; 
  }

  displayTrail() {
    push();
    noStroke();
    
    let baseColor;
    if (this.q == 0) baseColor = color(128, 128, 128);
    else if (this.q > 0) baseColor = color(255, 0, 0);
    else baseColor = color(0, 0, 255);

    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      let alpha = map(i, 0, this.history.length, 5, 80); 
      let sizeFactor = map(i, 0, this.history.length, 0.3, 0.9);
      
      baseColor.setAlpha(alpha);
      fill(baseColor);
      
      ellipse(pos.x, pos.y, this.r * 2 * sizeFactor, this.r * 2 * sizeFactor);
    }
    pop();
  }

  display() {
    push();
    stroke(0);
    strokeWeight(1/zoom);
    fill(this.q >= 0 ? 'red' : 'blue');
    if(this.q == 0){
      fill('grey');
    }
    if (lockedTarget === this) {
      stroke(255, 215, 0);
      strokeWeight(3 / zoom);
    } else if (draggedTarget === this) {
      stroke(0, 255, 100);
      strokeWeight(3 / zoom);
    }
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
    pop();
  }

  calculateCombinedForce(mover) {
    let forceDir = p5.Vector.sub(mover.position, this.position);
    let distance = constrain(forceDir.mag(), 5, 100);
    forceDir.normalize();

    let gravityMag = -(G * this.mass * mover.mass) / (distance * distance);
    let gravityForce = forceDir.copy().mult(gravityMag);

    let electrostaticMag = -(K * this.q * mover.q) / (distance * distance);
    let electroForce = forceDir.copy().mult(-electrostaticMag);

    return p5.Vector.add(gravityForce, electroForce);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update(dt = 1.0) {
    // If being explicitly dragged, update position and track real-time velocity
    if (this === draggedTarget) {
      let worldX = (mouseX - width / 2) / zoom + width / 2 - offsetx;
      let worldY = (mouseY - height / 2) / zoom + height / 2 - offsety;
      let targetPos = createVector(worldX, worldY);
      
      // Calculate throw velocity based on steady real-time frames, NOT relativistic dt
      let realTimeVelocity = p5.Vector.sub(targetPos, this.position);
      
      // Restrict human-dragged speed to a reasonable fraction of light (e.g., max 70% of c)
      // This keeps throws feeling natural and playable instead of breaking the engine
      if (realTimeVelocity.mag() > SPEED_OF_LIGHT * 0.7) {
        realTimeVelocity.setMag(SPEED_OF_LIGHT * 0.7);
      }
      
      this.velocity = realTimeVelocity;
      this.position = targetPos;
      this.acceleration.mult(0); // Clear accumulated kinetic stresses
    } else {
      let v = this.velocity.mag();
      
      let gamma = 1.0;
      if (v < SPEED_OF_LIGHT) {
        gamma = 1.0 / sqrt(1.0 - (v * v) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT));
      } else {
        gamma = 10000; 
      }
      let p = p5.Vector.mult(this.velocity, gamma * this.mass);
      
      let deltaP = p5.Vector.mult(this.acceleration, dt);
      p.add(deltaP);
      
      let pMag = p.mag();
      if (pMag > 0) {
        let denominator = sqrt((this.mass * this.mass) + (pMag * pMag) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT));
        this.velocity = p5.Vector.div(p, denominator);
      } else {
        this.velocity.set(0, 0);
      }
      
      this.position.add(p5.Vector.mult(this.velocity, dt));
      this.acceleration.mult(0);
    }
    
    // Manage history trail
    this.history.push(this.position.copy());
    if (this.history.length > this.maxTrailLength) {
      this.history.shift();
    }
  }
  
  collisions(mover) {
    return p5.Vector.dist(this.position, mover.position) < (this.r + mover.r);
  }
}
