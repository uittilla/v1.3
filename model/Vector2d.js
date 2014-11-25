/**
 * Vector2d library
 * @param x
 * @param y
 * @constructor
 */
var Vector2D = function (x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Modify this vector by adding the provided vector to it.
 * @param addVector
 */
Vector2D.prototype.add = function (addVector) {
    this.x = this.x + addVector.x;
    this.y = this.y + addVector.y;
}

/**
 * Gets the radian angle between this and vector
 */
Vector2D.prototype.getAngle = function(vector) {
    var dx = (vector.position.x) - (this.x),
        dy = (vector.position.y) - (this.y);
        
    return Math.atan2(dy, dx);
}

/**
 * Gets the distance between this and vector
 */
Vector2D.prototype.distance = function(vector) {
    var dx = (vector.position.x) - (this.x),
        dy = (vector.position.y) - (this.y);
    
    return Math.sqrt((dx * dx) + (dy * dy));
}

/**
 * Create new vector by adding the provided vector to it.
 * @param addVector
 * @returns {Vector2D}
 */
Vector2D.prototype.addNew = function (addVector) {
    return new Vector2D(this.x + addVector.x, this.y + addVector.y);
}

/**
 * Modify this vector by subtracting the provided vector from it.
 * @param subtractVector
 */
Vector2D.prototype.subtract = function (subtractVector) {
    this.x = this.x - subtractVector.x;
    this.y = this.y - subtractVector.y;
}

/**
 * Create new vector by subtracting the provided vector to it.
 * @param subtractVector
 * @returns {Vector2D}
 */
Vector2D.prototype.subtractNew = function (subtractVector) {
    return new Vector2D(this.x - subtractVector.x, this.y - subtractVector.y);
}

/**
 * Returns dot product from this vector and the provided vector.
 * @param dotVector
 * @returns {number}
 */
Vector2D.prototype.dot = function (dotVector) {
    return (this.x * dotVector.x) + (this.y * dotVector.y);
}

/**
 * Normalise this vector
 */
Vector2D.prototype.normalise = function () {
    var magnitude = this.magnitude();
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
}

/**
 * Length of the vector
 * @returns {number}
 */
Vector2D.prototype.magnitude = function () {
    var x = this.x * this.x; //Math.pow(this.x,2),
    var y = this.y * this.y; //Math.pow(this.y,2),
    var z = x + y;
    // Using:
    // f(x) = x*x - Input.value
    // f'(x) = 2*x
    // Assumes convergence in 10 iterations
    var X = 1;
    for (var i = 0; i < 8; i++)
        X = X - ((X * X - z) / (2 * X));
        
    z = X;

    return z;
    //return Math.sqrt(z);
}

/**
 * Create a copy of the vector
 * @returns {Vector2D}
 */
Vector2D.prototype.copy = function () {
    return new Vector2D(this.x, this.y);
}

/**
 * Multiply vector by the provided number to create a new vector.
 * @param scalar
 */
Vector2D.prototype.scalarMultiply = function (scalar) {
    this.x = this.x * scalar;
    this.y = this.y * scalar;
}

Vector2D.prototype.scalarMultiplyNew = function (scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
}

/**
 * Divide this vector by provided vector.
 * @param scalar
 */
Vector2D.prototype.scalarDivide = function (scalar) {
    this.x = this.x / scalar;
    this.y = this.y / scalar;
}

Vector2D.prototype.rotate = function (pivot, radianAngle) {
    var c = Math.cos(radianAngle);
    var s = Math.sin(radianAngle);
    this.x -= pivot.x;
    this.y -= pivot.y;
    var x = this.x * c - this.y * s;
    var y = this.x * s + this.y * c;
    this.x = x + pivot.x;
    this.y = y + pivot.y;
}

module.exports = Vector2D;