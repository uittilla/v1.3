"use strict";

var Vector2d = require('./Vector2d');

var Player = function (id, data) {
    this.position   = new Vector2d((Math.random() * 3000) + 1, (Math.random() * 2000) + 1);
    this.velocity   = new Vector2d(0, 0);
    this.vr         = 0; // rotation in degrees
    this._thrust    = 0;
    this.rotation   = -Math.PI/2;
    this.thruster   = false;
    this.shots      = [];
    this.particles  = [];
    this.id         = id;
    this.sheild     = false;
    this.score      = 0;
    this.round      = 1;
    this.name       = data.name;
    this.lives      = 3;
    this.start_move = 0;
    this.ship       = data.ship;
    this.height     = 3000;
    this.width      = 4000;
    this.radius     = 35;
    this.moveVector = 0;
    this.close      = false;
    this.baddy_close = 0;
    this.mass        = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

    return this;
}

/**
 * Calculate player x and y coords
 * @param game
 */
Player.prototype.updateXY = function () {
    this.boundsCheck();

    this.rotation += this.vr * Math.PI / 180;
    
    if (this.rotation < -6.283185) {
        this.rotation = 0;
    }
    
    if (this.rotation > 6.283185) {
        this.rotation = 0;
    }
    
    console.log(this.rotation);
    
    this.moveVector = this.velocity.scalarMultiplyNew(0.0);

    this.velocity.x += Math.cos(this.rotation) * this._thrust;
    this.velocity.y += Math.sin(this.rotation) * this._thrust;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
}

Player.prototype.boundsCheck = function () {
    var right = this.width, left = 0,
        top = 0, bottom = this.height;

    if (this.position.x > right) {
        this.position.x = left;
    }
    else if (this.position.x < left) {
        this.position.x = right;
    }
    if (this.position.y > bottom) {
        this.position.y = top;
    }
    else if (this.position.y < top) {
        this.position.y = bottom;
    }
}

Player.prototype.rotate = function(radianAngle) {
    var centre = new Vector2D(this.position.x, this.position.y);
    centre.add(this.B);
    centre.add(this.C);
    centre.scalarDivide(3);
    this.A.rotate(centre, radianAngle);
    this.B.rotate(centre, radianAngle);
    this.C.rotate(centre, radianAngle);
}

/**
 * Calculates platyers missile positions
 * @param game
 */
Player.prototype.updateMissileXY  = function (game) {
    var missile = {}, missileLength = this.shots.length - 1;

    for (var i = missileLength; i >= 0; i--) {
        missile = this.shots[i];

        if (game.shipMissileContact(this.id, missile)) {
            this.score -= 50;   // You got shot
        }

        if (game.missileContact(this.id, missile)) {
            this.score += 5;   // dead enemy
        }

        // tally up including vx + vy to account for ship speed.
        missile.position.x += (missile.velocity.x + this.velocity.x);
        missile.position.y += (missile.velocity.y + this.velocity.y);
        
        if (missile.position.x > this.width) {
            missile.position.x = -missile.width;
        }
        else if (missile.position.x < -missile.width) {
            missile.position.x = this.width;
        }

        if (missile.position.y > this.height) {
            missile.position.y = -missile.height;
        }
        else if (missile.position.y < -missile.height) {
            missile.position.y = this.height;
        }

        missile.lifeCtr++;

        if (missile.lifeCtr > missile.life) {
            this.shots.splice(i, 1);
            missile = null;
        }
    }
}

/**
 * Update explosion particles
 */
Player.prototype.updateParticles = function () {

    var particle = {};
    var remove = false;
    var particleLength = this.particles.length - 1;

    for (var i = particleLength; i >= 0; i--) {

        particle = this.particles[i];
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;

        particle.lifeCtr++;

        if (particle.lifeCtr > particle.life) {
            remove = true;
        }
        else if ((particle.position.x > this.width) ||
                 (particle.position.x < 0) ||
                 (particle.position.y > this.height) ||
                 (particle.position.y < 0))
        {
            remove = true;
        }

        if (remove) {
            this.particles.splice(i, 1);
            particle = null;
        }
    }
}

Player.prototype.addShot = function() {
    if (this.shots.length < 5) {
        this.shots.push(this.missile());
    }
}

/**
 * New player missile
 */
Player.prototype.missile = function () {
    
    var self  = this;
    
    return  {
        position: new Vector2d(self.position.x, self.position.y),
        velocity: new Vector2d(5 * Math.cos(self.rotation), 5 * Math.sin(self.rotation)),
        life:60,
        lifeCtr:0,
        width:2,
        height:2
    };
}

/**
 * Particles = explode
 * Legacy of no images
 */
Player.prototype.genParticles = function () {
    var self = this, particle;

    for (var i = 0; i < 15; i++) {
        particle = {
            position: new Vector2d(this.position.x, this.position.y),
            velocity: new Vector2d(-1, 1),
            life:15,
            lifeCtr:0
        };

        if (Math.random() < 0.5) {
            particle.dx *= -1;
            particle.dy *= -1;
        }

        this.particles.push(particle);
    }

    this.velocity.y = 0;
    this.velocity.x = 0;

    this.score -= 10;
    this.lives--;
}

Player.prototype.check = function (object) {
    var separationVector = object.position.subtractNew(this.position);
    var distance = separationVector.magnitude();
    var sumRadii = (this.radius + object.radius);
    var moveVector = this.moveVector.subtractNew(object.moveVector);

    distance -= sumRadii;

    if (moveVector.magnitude() < distance) {
        return false;
    }

    // Normalize the movevec
    var N = moveVector.copy();
    N.normalise();

    // D = N . C = ||C|| * cos(angle between N and C)
    var D = N.dot(separationVector);

    // Another early escape: Make sure that A is moving
    // towards B! If the dot product between the movevec and
    // B.center - A.center is less that or equal to 0,
    // A isn't isn't moving towards B
    if (D <= 0) {
        return false;
    }

    var F = (distance * distance) - (D * D);

    // Escape test: if the closest that A will get to B
    // is more than the sum of their radii, there's no
    // way they are going collide
    var sumRadiiSquared = sumRadii * sumRadii;
    if (F >= sumRadiiSquared) {
        return false;
    }

    // We now have F and sumRadii, two sides of a right triangle.
    // Use these to find the third side, sqrt(T)
    var T = sumRadiiSquared - F;

    // If there is no such right triangle with sides length of
    // sumRadii and sqrt(f), T will probably be less than 0.
    // Better to check now than perform a square root of a
    // negative number.
    if (T < 0) {
        return false;
    }

    // Therefore the distance the circle has to travel along
    // movevec is D - sqrt(T)
    // Using:
    // f(x) = x*x - Input.value
    // f'(x) = 2*x
    // Assumes convergence in 10 iterations
    var X = 1;
    for (var i = 0; i < 5; i++)
        X = X - ((X * X - T) / (2 * X));

    T = X;
    var distance = D - T; //Math.sqrt(T);

    // Get the magnitude of the movement vector
    var mag = moveVector.magnitude()

    // Finally, make sure that the distance A has to move
    // to touch B is not greater than the magnitude of the
    // movement vector.
    if (mag < distance) {
        return false;
    }

    ///moveVector.normalise();
    //moveVector.scalarMultiply(distance);

    //var ratio = moveVector.magnitude() / mag;
    //moveVector.scalarMultiply(ratio);
    //object.moveVector.scalarMultiply(ratio);
    
    return true;
}

Player.prototype.resolveCollision = function(object) {
    var n = this.position.subtractNew(object.position);

    // console.log("Enter");

    n.normalise();
    // Find the length of the component of each of the movement
    // vectors along n.
    // a1 = v1 . n
    // a2 = v2 . n
    var a1 = this.velocity.dot(n);
    var a2 = object.velocity.dot(n);
    //console.log("pass2");
    // Using the optimized version,
    // optimizedP =  2(a1 - a2)
    //              -----------
    //                m1 + m2
    var optimizedP = (2.0 * (a1 - a2)) / (this.mass + object.mass);

    // Calculate v1', the new movement vector of circle1
    // v1' = v1 - optimizedP * m2 * n
    //var v1' = v1 - optimizedP * circle2.mass * n;

    var nv_a = this.velocity.subtractNew(n.scalarMultiplyNew(optimizedP*object.mass));

    // Calculate v1', the new movement vector of circle1
    // v2' = v2 + optimizedP * m1 * n
    //Vector v2' = v2 + optimizedP * circle1.mass * n;
    var nv_b = object.velocity.addNew(n.scalarMultiplyNew(optimizedP*this.mass));

    this.velocity = nv_a;
    object.velocity = nv_b;
}

module.exports = Player;