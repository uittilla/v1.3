"use strict";

class Keyboard {

    constructor() {
        // names
        this.KEY_NAME_THRUSTER = "up";
        this.KEY_NAME_TELEPORT = "t";
        this.KEY_NAME_LEFT     = "left";
        this.KEY_NAME_RIGHT    = "right";
        this.KEY_NAME_SPACE    = "space";
        this.KEY_NAME_HELP     = "h";
        this.KEY_NAME_MAP      = "m";
        this.KEY_NAME_SMART    = "s";
        this.KEY_NAME_CTRL     = "control";
        this.KEY_NAME_SCORE    = "score";
        // types
        this.KEY_TYPE_UP       = "keyup";
        this.KEY_TYPE_DOWN     = "keydown";
    }


    /**
     * Player key bindings
     */
    keyEvent(keyCode, type, player) {
        var keyName = String.fromCharCode(keyCode).toLowerCase();

        switch(keyCode) {
            case 37:
                keyName = this.KEY_NAME_LEFT;
            break;
            case 39:
                keyName = this.KEY_NAME_RIGHT;
            break;
            case 38:
                keyName = this.KEY_NAME_THRUSTER;
            break;
            case 32:
                keyName = this.KEY_NAME_SPACE;
            break;
            case 17:
                keyName = this.KEY_NAME_CTRL;
            break;
            case 40:
                keyName = this.KEY_NAME_CTRL;
            break;
            case 84:
                keyName = this.KEY_NAME_TELEPORT;
            break;
            case 77:
                keyName = this.KEY_NAME_MAP;
            break;
            default:
            break;
        }

        this.move(type, keyName, player);
    }

    /**
     * Act on key press
     */
    move(keyType, keyName, player) {

        // Thruster is off
        if (keyName == this.KEY_NAME_THRUSTER && keyType == this.KEY_TYPE_UP) {
            player.thruster = false;
            player._thrust = 0;
            player.vr = 0;
        }
        // Thruster on
        else if (keyName == this.KEY_NAME_THRUSTER && keyType == this.KEY_TYPE_DOWN) {
            player.thruster = true;
            player._thrust = 0.3;
        }
        // Turning left
        if (keyName == this.KEY_NAME_LEFT && keyType == this.KEY_TYPE_DOWN) {
            player.vr = -7;
        }
        // Turning right
        if (keyName == this.KEY_NAME_RIGHT && keyType == this.KEY_TYPE_DOWN) {
            player.vr = 7;
        }
        // Stop turning
        if ((keyName == this.KEY_NAME_RIGHT || keyName == this.KEY_NAME_LEFT ) && keyType == this.KEY_TYPE_UP) {
            player.vr = 0;
        }
        // v1 here to allow thrusting turning and firing
        if (keyName == this.KEY_NAME_SPACE && keyType == this.KEY_TYPE_DOWN) {
            if (!player.sheild) {
                if (player.shots.length < 5) {
                    player.addShot();
                }
            }
        }
        else if (keyName == this.KEY_NAME_SPACE && keyType == this.KEY_TYPE_UP) { }

        if (keyName == this.KEY_NAME_CTRL && keyType == this.KEY_TYPE_DOWN) {
            player.sheild = true;
        }

        if (keyName == this.KEY_NAME_CTRL && keyType == this.KEY_TYPE_UP) {
            player.sheild = false;
        }

        if (keyName == this.KEY_NAME_TELEPORT && keyType == this.KEY_TYPE_DOWN) {
            player.position.x = Math.random() * Math.floor(Math.random() * (3000 - 1 + 1)) + 1;
            player.position.y = Math.random() * Math.floor(Math.random() * (2000 - 1 + 1)) + 1;
        }

        if (keyName == this.KEY_NAME_HELP && keyType == this.KEY_TYPE_DOWN) {
            player.help = true;
        }

        if (keyName == this.KEY_NAME_HELP && keyType == this.KEY_TYPE_UP) {
            player.help = false;
        }

        if (keyName == this.KEY_NAME_MAP && keyType == this.KEY_TYPE_DOWN) {
            player.map = player.map !== true;
        }
    }
}

module.exports=Keyboard;
