"use strict";

const Vector2d = require('./Vector2d.js');

class Enemy {

    constructor(id) {
        let colours = ['red', 'green', 'yellow', 'orange', 'blue', 'black'];
        let rad = 20;

        this.height = 3000;
        this.width = 4000;
        this.radius = null;
        this.radius = rad;
        this.col = colours[Math.floor(Math.random() * colours.length)];
        this.position = new Vector2d(Math.floor(Math.random() * (this.width - rad + 1)) + rad,
            Math.floor(Math.random() * (this.height - rad + 1)) + rad);
        this.velocity = new Vector2d(Math.floor(Math.random() * (50 - rad + 1)) + rad,
            Math.floor(Math.random() * (50 - rad + 1)) + rad);
        this.moveVector = new Vector2d(0, 0);
        this.id = id;
        this.hits = 0;
        this.shots = [];
        this.particles = [];
        this.explode = false;
        this.mass = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

        return this;
    }

    /**
     * Updates enemy x and y
     */
    updateXY() {
        this.boundsCheck();
        this.moveVector = this.velocity.scalarMultiplyNew(0.03);

        this.position.x = this.position.x + (this.moveVector.x);
        this.position.y = this.position.y + (this.moveVector.y);
    }

    /**
     * Bounce off boundries
     */
    boundsCheck() {
        if (this.position.x <= this.radius) {
            this.position.x = this.radius;
            this.velocity.x = -this.velocity.x;
        }
        if (this.position.x >= (this.width - this.radius)) {
            this.position.x = this.width - this.radius;
            this.velocity.x = -this.velocity.x;
        }
        if (this.position.y <= this.radius) {
            this.position.y = this.radius;
            this.velocity.y = -this.velocity.y;
        }
        if (this.position.y >= (this.height - this.radius)) {
            this.position.y = this.height - this.radius;
            this.velocity.y = -this.velocity.y;
        }
    }

    /**
     * Baddies explode too
     */
    updateParticles() {
        let particle = {};
        let remove = false;

        let particleLength = this.particles.length - 1;

        for (let i = particleLength; i >= 0; i--) {

            particle = this.particles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;

            particle.lifeCtr++;

            if (particle.lifeCtr > particle.life) {
                remove = true;
            } else if ((particle.x > this.width) || (particle.x < 0) || (particle.y > this.height) || (particle.y < 0)) {
                remove = true;
            }

            if (remove) {
                this.particles.splice(i, 1);
                particle = null;
            }
        }
    }

    /**
     * Enemy shots x,y
     */
    updateEnemyMissileXY(game) {
        let missile = {};
        let missileLength = this.shots.length - 1;

        for (let i = missileLength; i >= 0; i--) {
            missile = this.shots[i];

            game.enemyMissileContact(missile);

            // tally up including vx + vy to account for ship speed.
            missile.position.x += (missile.velocity.x);
            missile.position.y += (missile.velocity.y);

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
     * Produce missiles
     * @param enemy
     * @returns {{dx: number, dy: number, x: *, y: *, life: number, lifeCtr: number, width: number, height: number}}
     */
    enemyMissile(enemy) {
        let self = this;
        let vol = new Vector2d(-(Math.random() * enemy.radius) * 5, (Math.random() * enemy.radius) * 5);
        let pos = new Vector2d(self.position.x, self.position.y);

        return {
            velocity: vol,
            position: pos,
            life: 100,
            lifeCtr: 0,
            width: 2,
            height: 2
        };
    }

    /**
     * Collision detection
     * @param object
     * @returns {boolean}
     */
    checkCollision(object) {

        let separationVector = object.position.subtractNew(this.position);
        let distance = separationVector.magnitude();
        let sumRadii = (this.radius + object.radius);
        let moveVector = this.moveVector.subtractNew(object.moveVector);

        distance -= sumRadii;

        if (moveVector.magnitude() < distance) {
            return false;
        }

        // Normalize the movevec
        let N = moveVector.copy();
        N.normalise();

        // D = N . C = ||C|| * cos(angle between N and C)
        let D = N.dot(separationVector);

        // Another early escape: Make sure that A is moving
        // towards B! If the dot product between the movevec and
        // B.center - A.center is less that or equal to 0,
        // A isn't isn't moving towards B
        if (D <= 0) {
            return false;
        }

        let F = (distance * distance) - (D * D);

        // Escape test: if the closest that A will get to B
        // is more than the sum of their radii, there's no
        // way they are going collide
        let sumRadiiSquared = sumRadii * sumRadii;
        if (F >= sumRadiiSquared) {
            return false;
        }

        // We now have F and sumRadii, two sides of a right triangle.
        // Use these to find the third side, sqrt(T)
        let T = sumRadiiSquared - F;

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
        let X = 1;
        for (let i = 0; i < 5; i++)
            X = X - ((X * X - T) / (2 * X));

        T = X;
        distance = D - T; //Math.sqrt(T);

        // Get the magnitude of the movement vector
        let mag = moveVector.magnitude();

        // Finally, make sure that the distance A has to move
        // to touch B is not greater than the magnitude of the
        // movement vector.
        if (mag < distance) {
            return false;
        }

        moveVector.normalise();
        moveVector.scalarMultiply(distance);

        let ratio = moveVector.magnitude() / mag;
        moveVector.scalarMultiply(ratio);
        object.moveVector.scalarMultiply(ratio);

        return true;
    }

    resolveCollision(a, b) {
        let n = a.position.subtractNew(b.position);

        // console.log("Enter");

        n.normalise();
        // Find the length of the component of each of the movement
        // vectors along n.
        // a1 = v1 . n
        // a2 = v2 . n
        let a1 = a.velocity.dot(n);
        let a2 = b.velocity.dot(n);
        //console.log("pass2");
        // Using the optimized version,
        // optimizedP =  2(a1 - a2)
        //              -----------
        //                m1 + m2
        let optimizedP = (2.0 * (a1 - a2)) / (a.mass + b.mass);

        // Calculate v1', the new movement vector of circle1
        // v1' = v1 - optimizedP * m2 * n
        //let v1' = v1 - optimizedP * circle2.mass * n;

        let nv_a = a.velocity.subtractNew(n.scalarMultiplyNew(optimizedP * b.mass));

        // Calculate v1', the new movement vector of circle1
        // v2' = v2 + optimizedP * m1 * n
        //Vector v2' = v2 + optimizedP * circle1.mass * n;
        let nv_b = b.velocity.addNew(n.scalarMultiplyNew(optimizedP * a.mass));

        //console.log("pass3");

        //console.log("nv_a", nv_a);
        //console.log("nv_b", nv_b);

        a.velocity = nv_a;
        b.velocity = nv_b;

        // console.log("pass4", a.velocity);
    }
}
module.exports = Enemy;