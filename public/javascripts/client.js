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

var Game = function() {
    return this;
}

Game.prototype = {
    players: {},
    enemies: {},
    socket: io.connect(location.href),
    id: null,
    stars: [],
    suns: [],
    eimages: [
        {img: "../images/e1.png"},
        {img: "../images/e2.png"},
        {img: "../images/e3.png"}
    ],
    explosion: null,
    level: 0,
    fighter: new Image(),
    fighters: [
        {img: "../images/fighter.png"},
        {img: "../images/fighter1.png"},
        {img: "../images/fighter2.png"},
        {img: "../images/fighter3.png"}
    ],
    sys: {
        n2: {
            img: '../images/n2.png',
            x: 600,
            y: 900
        }
    },
    enemy_explode: new Audio("/media/explode.mp3"), // buffers automatically when created
    player_missile: new Audio("/media/laser.wav")   
}

Game.prototype.init = function (user, ship) {
    var self = this;
    this.user = user;

    self.socket.emit('register', {"name": user, "ship": ship});

    this.setup(user);

    this.catchUserEvent();

    for (var i = 0; i < 500; i++) {
        var s = this.star();
        this.stars.push(s);
    }

    var img = {};
    for (var i in this.eimages) {
        img = this.eimages[i];
        img.obj = new Image();
        img.obj.onload = function () {
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

    neb.imageObj.onload = function () {
        neb.imageObj.style.zindex = -1;
    };

    neb.imageObj.src = neb.img;

    var self = this;

    (function drawFrame() {
        requestId = window.requestAnimationFrame(drawFrame, canvas);
        self.render();
    }());
}

Game.prototype.catchUserEvent = function() {
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
Game.prototype.setup = function (user) {
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

Game.prototype.showMap = function(player) {
    var enemy = {};
    var track = [];
    var colour = "red";

    for (var e in this.enemies) {
        enemy = this.enemies[e];
        track.push({"color": "red", "x": enemy.position.x, "y": enemy.position.y});
    }

    for (var e in this.players) {
        enemy = this.players[e];
        var local_player = (e == Game.id) ? true : false;
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

Game.prototype.showHelp = function(player) {
    context.strokeText("Arrow keys: Move", player.position.x, player.position.y - 60);
    context.stroke();
    context.strokeText("Space bar: Shoot", player.position.x, player.position.y - 50);
    context.stroke();
    context.strokeText("Ctrl: Shield", player.position.x, player.position.y - 40);
    context.stroke();
    context.strokeText("t: teleport", player.position.x, player.position.y - 30);
    context.stroke();
}

Game.prototype.showDefault = function(player) {
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
Game.prototype.showStatus = function (player) {
    context.globalAlpha = 0.5;
    context.font = "10px sans-serif";
    context.strokeStyle = "white";

    var user = player.id === Game.id;
    
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

Game.prototype.interpolateObject = function(object) {
    if(this.interpolate) {
        if(object.vx !== 0) {
            object.x += 1 * Math.round((1 * 0.016) * 60);
            object.y += 1 * Math.round((1 * 0.016) * 60);
        }
    }
}

/**
 * Render ship
 */
Game.prototype.renderShips = function () {
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
            context.strokeText("Game Over",player.position.x-100, player.position.y-100);
            context.stroke();

            setTimeout(function(){
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
Game.prototype.render = function () {

    context.save();
    context.clearRect(0, 0, 3000, 2000);

    this.renderStars();
    this.renderNeb();

    globalAlpha = 0.8;

    this.renderEnemies();
    this.renderShips();
    this.renderMissiles();
    this.renderEnemyMissiles();
    this.renderParticles();
    this.renderEnemyParticles();

    context.restore();
}

Game.prototype.renderEnemies = function() {
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
Game.prototype.renderMissiles = function () {
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
Game.prototype.renderEnemyMissiles = function () {
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
Game.prototype.renderEnemyParticles = function () {
    var particle = {}, srcX = 0, srcY = 0, eX = 0, eY = 0, offset = 70;

    for (var p in this.enemies) {
        player = this.enemies[p];
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
Game.prototype.renderParticles = function () {
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
Game.prototype.star = function () {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3
    };
}

/**
 * Create a sun: Looks crap not used
 */
Game.prototype.sun = function () {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 15
    };
}

/**
 * Show stars
 */
Game.prototype.renderStars = function () {
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);

    var starsLength = this.stars.length - 1;
    var star = {};

    //for (var i = starsLength; i > 0; i--) {
    while(starsLength--) {
        star = this.stars[starsLength];

        context.fillStyle = "#FFF";
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
        context.restore();
    }
}

Game.prototype.renderNeb = function() {
    var neb = this.sys['n2'];
    context.drawImage(neb.imageObj, neb.x, neb.y);
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
