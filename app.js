"use strict";

const http         = require('http');
const express      = require('express');
const path         = require('path');
const favicon      = require('serve-favicon');
const logger       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');

const routes = require('./routes/index');
const users  = require('./routes/users');

const app = express();

const Game    = require('./model/game');
const Player  = require('./model/player');
const Enemy   = require('./model/enemy');
const BISON   = require('bison');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

const server = http.createServer(app);
const io = require('socket.io').listen(server);
const Kb = require('./model/keyboard');
const Keyboard = new Kb();

io.sockets.on('connection', function (socket) {

    socket.on('register', function (data) {
        game.players[socket.id] = new Player(socket.id, data);     // add the new player
        socket.emit("ID", socket.id);
    });

    socket.on('keyup', function (event) {
        var data = BISON.decode(event);
        if (game.players[data.id]) {
            game.players[data.id].end_move = game.unixTime();
            Keyboard.keyEvent(data.key, data.type, game.players[data.id]);
        }
    });

    socket.on('keydown', function (event) {
        var data = BISON.decode(event);
        if (game.players[data.id]) {
            game.players[data.id].start_move = game.unixTime();
            Keyboard.keyEvent(data.key, data.type, game.players[data.id]);
        }
    });

    socket.on('disconnect', function () {
        var that = this;
        io.sockets.emit('remove', that.id);
        delete game.players[this.id];
    });
});

let dataStream = [];
let game = new Game();

var FPS = 200;

setInterval(function () {
    game.worker();

    dataStream[0] = game.getPlayers();
    dataStream[1] = game.getEnemies();

    io.sockets.emit('update', BISON.encode(dataStream));
}, FPS);

server.listen(3000);

module.exports = app;
