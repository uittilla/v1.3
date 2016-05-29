"use strict";
/**
 * Vector2d library
 * @param x
 * @param y
 * @constructor
 */
class Vector2D {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Modify this vector by adding the provided vector to it.
     * @param addVector
     */
    add(addVector) {
        this.x = this.x + addVector.x;
        this.y = this.y + addVector.y;
    }

    /**
     * Gets the radian angle between this and vector
     */
    getAngle (vector) {
        let dx = (vector.position.x) - (this.x),
            dy = (vector.position.y) - (this.y);

        return Math.atan2(dy, dx);
    }

    /**
     * Gets the distance between this and vector
     */
    distance (vector) {
        let dx = (vector.position.x) - (this.x),
            dy = (vector.position.y) - (this.y);

        return Math.sqrt((dx * dx) + (dy * dy));
    }

    /**
     * Create new vector by adding the provided vector to it.
     * @param addVector
     * @returns {Vector2D}
     */
    addNew(addVector) {
        return new Vector2D(this.x + addVector.x, this.y + addVector.y);
    }

    /**
     * Modify this vector by subtracting the provided vector from it.
     * @param subtractVector
     */
    subtract(subtractVector) {
        this.x = this.x - subtractVector.x;
        this.y = this.y - subtractVector.y;
    }

    /**
     * Create new vector by subtracting the provided vector to it.
     * @param subtractVector
     * @returns {Vector2D}
     */
    subtractNew(subtractVector) {
        return new Vector2D(this.x - subtractVector.x, this.y - subtractVector.y);
    }

    /**
     * Returns dot product from this vector and the provided vector.
     * @param dotVector
     * @returns {number}
     */
    dot(dotVector) {
        return (this.x * dotVector.x) + (this.y * dotVector.y);
    }

    /**
     * Normalise this vector
     */
    normalise() {
        let magnitude = this.magnitude();
        this.x = this.x / magnitude;
        this.y = this.y / magnitude;
    }

    /**
     * Length of the vector
     * @returns {number}
     */
    magnitude() {
        let x = this.x * this.x; //Math.pow(this.x,2),
        let y = this.y * this.y; //Math.pow(this.y,2),
        let z = x + y;
        // Using:
        // f(x) = x*x - Input.value
        // f'(x) = 2*x
        
        // Assumes convergence in 10 iterations
        let X = 1;
        for (let i = 0; i < 8; i++)
            X = X - ((X * X - z) / (2 * X));

        z = X;

        return z;
        //return Math.sqrt(z);
    }

    /**
     * Create a copy of the vector
     * @returns {Vector2D}
     */
    copy() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Multiply vector by the provided number to create a new vector.
     * @param scalar
     */
    scalarMultiply(scalar) {
        this.x = this.x * scalar;
        this.y = this.y * scalar;
    }

    scalarMultiplyNew(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    /**
     * Divide this vector by provided vector.
     * @param scalar
     */
    scalarDivide(scalar) {
        this.x = this.x / scalar;
        this.y = this.y / scalar;
    }

    rotate(pivot, radianAngle) {
        let c = Math.cos(radianAngle);
        let s = Math.sin(radianAngle);

        this.x -= pivot.x;
        this.y -= pivot.y;

        let x = this.x * c - this.y * s;
        let y = this.x * s + this.y * c;
        
        this.x = x + pivot.x;
        this.y = y + pivot.y;
    }

}
    
module.exports = Vector2D;