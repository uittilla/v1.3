"use strict";

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function (callback) {
            return window.setTimeout(callback, 17 /*~ 1000/60*/);
        });
}

if (!window.cancelRequestAnimationFrame) {
    window.cancelRequestAnimationFrame = (window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.clearTimeout);
}

// Keyname constants

var user = "", requestId = 0;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

/**
 *
 * @returns {Game}
 * @constructor
 */
class Game {

    /**
     *
     * @type {{
 *    players: {},
 *    enemies: {},
 *    socket: *,
 *    id: null,
 *    stars: Array,
 *    suns: Array,
 *    eimages: {
 *      img: string
 *    }[],
 *    explosion: null,
 *    level: number,
 *    fighter: Image,
 *    fighters: {
 *       img: string
 *    }[],
 *    sys: {
 *       n2: {
 *          img: string,
 *          x: number,
 *          y: number
 *       }
 *    },
 *    enemy_explode: Audio,
 *    player_missile: Audio
 *  }}
     */
    constructor() {
        this.players = {};
        this.enemies = {};
        this.socket = io.connect(location.href);
        this.id = null;
        this.stars = [];
        this.suns = [];
        this.eimages = [
            {img: "../images/e1.png"},
            {img: "../images/e2.png"},
            {img: "../images/e3.png"}
        ];
        this.explosion = null;
        this.level = 0;
        this.fighter = new Image();
        this.fighters = [
            {img: "../images/fighter.png"},
            {img: "../images/fighter1.png"},
            {img: "../images/fighter2.png"},
            {img: "../images/fighter3.png"}
        ];
        this.sys = {
            n2: {
                img: '../images/n2.png',
                x: 600,
                y: 900
            }
        };
        this.enemy_explode = new Audio("/media/explode.mp3"); // buffers automatically when created
        this.player_missile = new Audio("/media/laser.wav");
    }

    init(user, ship) {
        var self = this;
        this.user = user;

        self.socket.emit('register', {"name": user, "ship": ship});

        this.setup(user, ship);

        this.catchUserEvent();

        for (var i = 0; i < 500; i++) {
            var s = this.star();
            this.stars.push(s);
        }

        var img = {};
        for (var i in this.eimages) {
            img = this.eimages[i];
            img.obj = new Image();
            img.obj.onload = function() {
                img.imgid = Math.round(Math.random());
            }
            img.obj.src = img.img;
        }

        this.explosion = new Image();
        this.explosion.src = "../images/explosion.png";
        this.fighter.src = "./images/fighter.png";

        var ship = {}, s;
        for (s in this.fighters) {
            ship = this.fighters[s];
            ship.imageObj = new Image();
            ship.imageObj.src = ship.img;
        }

        var neb = {};
        neb = this.sys['n2'];
        neb.imageObj = new Image();

        neb.imageObj.onload= function ()
        {
            neb.imageObj.style.zindex = -1;
        };

        neb.imageObj.src = neb.img;

        var self = this;

        (function drawFrame() {
            requestId = window.requestAnimationFrame(drawFrame, canvas);
            self.render();
        }());
    }

    catchUserEvent() {
        var self = this;

        document.addEventListener('keydown', function (event) {
            var data = BISON.encode({"key": event.keyCode, "type": event.type, "id": self.id});
            self.socket.emit('keydown', data);
        }, false);

        document.addEventListener('keyup', function (event) {
            var data = BISON.encode({"key": event.keyCode, "type": event.type, "id": self.id});
            self.socket.emit('keyup', data);
        }, false);
    }

    /**
     * Listen for socket events
     */
    setup(user, ship) {
        var self = this;

        this.socket.on('connect', function () {
            self.socket.emit('register', {"name": user, "ship": ship});
        });

        this.socket.on('ID', function (id) {
            self.id = id;
        });

        this.interpolate = false;

        this.socket.on('update', function (data) {
            var decode = BISON.decode(data);
            self.level = decode[0].round;
            self.players = decode[0];
            self.enemies = decode[1];
            self.interpolate = true;

            // self.intTS = setTimeout(function(){
            //     self.interpolate = false;
            // }.bind(this),33);

        });

        this.socket.on('remove', function (id) {
            delete self.players[id];
        });
    }

    showMap(player) {
        var enemy = {};
        var track = [];
        var colour = "red";

        for (var e in this.enemies) {
            enemy = this.enemies[e];
            track.push({"color": "red", "x": enemy.position.x, "y": enemy.position.y});
        }

        for (var e in this.players) {
            enemy = this.players[e];
            var local_player = (e == this.id);
            colour = (local_player) ? "green" : "blue";
            track.push({"color": colour, "x": enemy.position.x, "y": enemy.position.y});
        }

        var trackers = track.length - 1, tracked = {};

        var px = (player.position.x + 10);
        var py = (player.position.y - 120);

        for (var i = trackers; i >= 0; i--) {
            tracked = track[i];
            var x = (tracked.x / 30);
            var y = (tracked.y / 20);

            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.translate(px + x, py + y);
            context.strokeStyle = tracked.color;
            context.globalAlpha = 1;
            context.beginPath();
            context.moveTo(-1, -1);
            context.lineTo(1, -1);
            context.lineTo(-1, 1);
            context.stroke();
            context.closePath();
            context.restore();
        }

        track = [];
    }

    showHelp(player) {
        context.strokeText("Arrow keys: Move", player.position.x, player.position.y - 60);
        context.stroke();
        context.strokeText("Space bar: Shoot", player.position.x, player.position.y - 50);
        context.stroke();
        context.strokeText("Ctrl: Shield", player.position.x, player.position.y - 40);
        context.stroke();
        context.strokeText("t: teleport", player.position.x, player.position.y - 30);
        context.stroke();
    }

    showDefault(player) {
        var vx = parseFloat(player.velocity.x),
            vy = parseFloat(player.velocity.y),
            strx = vx.toFixed(10),
            stry = vx.toFixed(10);

        strx = strx.substring(0, strx.length - 7);
        stry = stry.substring(0, stry.length - 7);

        context.strokeText("Level: " + player.round, player.position.x, player.position.y - 30);
        context.stroke();
        context.strokeText(player.name + " (" + player.lives + " : " + player.score + ")", player.position.x, player.position.y - 40);
        context.stroke();
    }

    /**
     * Show help, map, etc
     */
    showStatus(player) {
        context.globalAlpha = 0.5;
        context.font = "10px sans-serif";
        context.strokeStyle = "white";

        var user = player.id === this.id;

        console.log(user, player);

        if (user) {
            if (player.map) {
                this.showMap(player);
            } else if (player.help) {
                this.showHelp(player);
            } else {
                this.showDefault(player);
            }
        }
    }

    interpolateObject(object) {
        if (this.interpolate) {
            if (object.vx !== 0) {
                object.x += Math.round((1 * 0.016) * 60);
                object.y += Math.round((1 * 0.016) * 60);
            }
        }
    }

    /**
     * Render ship
     */
    renderShips() {
        var player = {};
        var exhaust = ['red', 'orange', 'yellow', 'purple', 'green'];
        var flame = [30, 31, 32, 33, 34, 35];

        var x = 10;

        for (var p in this.players) {
            player = this.players[p];

            if (player.lives >= 0) {
                context.save();
                this.interpolateObject(player);

                this.showStatus(player);

                context.lineWidth = 1;
                context.translate(player.position.x, player.position.y);
                context.rotate(player.rotation);

                if (player.particles.length > 0) {

                } else {
                    context.globalAlpha = 1;
                    context.beginPath();
                    context.drawImage(this.fighters[player.ship].imageObj, -20, -23);
                    context.closePath();

                    if (player.thruster) {
                        context.beginPath();
                        context.moveTo(-17.5, -2.5);
                        context.lineTo(-flame[Math.floor(flame.length * Math.random())], 0);
                        context.lineTo(-17.5, 2);
                        context.fillStyle = exhaust[Math.floor(exhaust.length * Math.random())];
                        context.fill();
                        context.stroke();
                        context.closePath();
                    }

                    if (player.sheild) {
                        context.beginPath();
                        context.globalAlpha = 0.1;
                        context.lineStyle = "black";
                        context.fillStyle = exhaust[Math.floor(exhaust.length * Math.random())];
                        context.arc(-1, -1, 35, 0, 2 * Math.PI, true);
                        context.fill();
                        context.stroke();
                        context.closePath();
                    }
                }

                context.restore();

            } else {
                context.font = "50px sans-serif";
                context.strokeStyle = "white";
                context.strokeText("Game Over", player.position.x - 100, player.position.y - 100);
                context.stroke();

                setTimeout(function () {
                    window.cancelRequestAnimationFrame(requestId);
                    window.location = location.href;
                }, 3000);
            }
        }

        if (this.id) {
            var thisPlayer = this.players[this.id];
            var screen = document.getElementById('canvas');
            if (screen) {
                if (thisPlayer) {
                    window.scroll(thisPlayer.position.x - 500, thisPlayer.position.y - 500);
                }
            }
        }
    }

    /**
     * Wrapper to render everything
     */
    render() {

        context.save();
        context.clearRect(0, 0, 3000, 2000);

        this.renderStars();
        this.renderNeb();

        this.globalAlpha = 0.8;

        this.renderEnemies();
        this.renderShips();
        this.renderMissiles();
        this.renderEnemyMissiles();
        this.renderParticles();
        this.renderEnemyParticles();

        context.restore();
    }

    /**
     *
     */
    renderEnemies() {
        var baddy;

        for (var e in this.enemies) {
            baddy = this.enemies[e];

            this.interpolateObject(baddy);

            context.beginPath();

            if (baddy.particles.length <= 0) {
                context.drawImage(this.eimages[baddy.id].obj, baddy.position.x - 20, baddy.position.y - 19);
            }

            context.closePath();
        }
    }

    /**
     * Show player missiles
     */
    renderMissiles() {
        var missile = {};
        var player = {};
        var missile = {};

        for (var p in this.players) {
            player = this.players[p];
            var missileLength = player.shots.length - 1;

            for (var i = missileLength; i >= 0; i--) {
                missile = player.shots[i];
                if (missile.hasOwnProperty("position")) {

                    context.save();
                    context.setTransform(1, 0, 0, 1, 0, 0);
                    context.translate(missile.position.x, missile.position.y);

                    context.strokeStyle = 'red';
                    context.globalAlpha = 1;

                    context.beginPath();
                    context.moveTo(-1, -1);
                    context.lineTo(1, -1);
                    context.lineTo(1, 1);
                    context.lineTo(-1, 1);
                    context.lineTo(-1, -1);
                    context.stroke();
                    context.closePath();

                    context.restore();
                }
            }
        }
    }

    /**
     * Show enemy missiles
     */
    renderEnemyMissiles() {
        var missile = {}, ball = {};

        for (var e in this.enemies) {
            var ball = this.enemies[e], missileLength = ball.shots.length - 1;

            for (var i = missileLength; i >= 0; i--) {
                missile = ball.shots[i];
                context.save();
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.translate(missile.position.x, missile.position.y);
                context.strokeStyle = "yellow";
                context.globalAlpha = 1;
                context.beginPath();
                context.moveTo(-1, -1);
                context.lineTo(1, -1);
                context.lineTo(1, 1);
                context.lineTo(-1, 1);
                context.lineTo(-1, -1);
                context.stroke();
                context.closePath();
                context.restore();
            }
        }
    }

    /**
     * Enemy explosions
     */
    renderEnemyParticles() {
        var particle = {}, srcX = 0, srcY = 0, eX = 0, eY = 0, offset = 70;

        for (var p in this.enemies) {
            let player = this.enemies[p];
            var particleLength = player.particles.length - 1;
            for (var i = particleLength; i >= 0; i--) {
                particle = player.particles[i];
                context.save(); //save current state in stack
                context.beginPath();
                context.drawImage(this.explosion, srcX, srcY, 124, 124, particle.x - offset, particle.y - offset, 124, 124);
                context.closePath();
                srcX += 124;
                srcY += 124;
                context.restore(); //pop old state on to screen
            }
        }

        srcX = 0;
        srcY = 0;
    }

    /**
     * Draw explosion from sprite
     */
    renderParticles() {
        var particle = {}, player, particleLength;
        var srcX = 125, srcY = 250, eX = 0, eY = 0, offset = 70;
        for (var p in this.players) {
            player = this.players[p];
            if (player.hasOwnProperty("particles")) {
                particleLength = player.particles.length - 1;

                for (var i = particleLength; i >= 0; i--) {
                    particle = player.particles[i];
                    context.save(); //save current state in stack
                    context.beginPath();
                    context.drawImage(this.explosion, srcX, srcY, 124, 124, particle.position.x - offset, particle.position.y - offset, 124, 124);
                    context.stroke();
                    context.closePath();
                    srcX += 124;
                    srcY += 124;
                    context.restore(); //pop old state on to screen
                }
            }

        }

        srcX = 0;
        srcY = 0;
    }

    /**
     * Make a star (background)
     */
    star() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3
        };
    }

    /**
     * Create a sun: Looks crap not used
     */
    sun() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 15
        };
    }

    /**
     * Show stars
     */
    renderStars() {
        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);

        var starsLength = this.stars.length - 1;
        var star = {};

        //for (var i = starsLength; i > 0; i--) {
        while (starsLength--) {
            star = this.stars[starsLength];

            context.fillStyle = "#FFF";
            context.beginPath();
            context.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
            context.restore();
        }
    }

    /**
     *
     */
    renderNeb() {
        var neb = this.sys['n2'];
        context.drawImage(neb.imageObj, neb.x, neb.y);
    }

}

    /**
     * User init
     */

function go(fighter) {
    var ship = document.getElementById(fighter);
    document.getElementById('setup').style.display = "none";

    var game = new Game();
    game.init("____", ship.value);
}
