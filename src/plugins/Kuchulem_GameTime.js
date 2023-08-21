if (!Kuchulem) {
    throw new Error("Kuchulem_Events requires Kuchulem plugin to be loaded first");
}

Kuchulem.GameTime = {
    pluginName: "Kuchulem_GameTime"
}

/*:
 * @target MZ
 * @plugindesc Manages in-game time.
 * @author Kuchulem
 *
 * @help Kuchulem_GameTime.js
 *
 * This plugins adds an in-game time system with a $gameClock object, a clock
 * sprite displayed in the screen on maps and commands to manipulate in-game
 * time.
 * 
 * @param minutesVariableId
 * @type variable
 * @text Variable storing minutes
 * @desc Pick the variable that will store the in-game minutes
 * 
 * @param hoursVariableId
 * @type variable
 * @text Variable storing hours
 * @desc Pick the variable that will store the in-game hours
 * 
 * @param daysVariableId
 * @type variable
 * @text Variable storing days
 * @desc Pick the variable that will store the in-game days
 * 
 * @param framesPerMinute
 * @type number
 * @text Frames for an in-game minute
 * @desc Set the number of frames for an in-game minute (reminder : 60 frames = 1 second IRL)
 * @default 300
 * 
 * @param displaySpan
 * @type number
 * @min 1
 * @max 60
 * @text Minutes display span
 * @desc Sets the minutes display span. Reprents the number of minutes for the clock
 *       display to change.
 *       ie: if set to 1, the clock will change on every minute and display
 *       8:01, 8:02, 8:03, etc. If set to 15 the clock display will change every
 *       15 minutes and display 8:00, 8:15, 8:30, 8:45, etc.
 * 
 * @command start
 * @text Start the time
 * @desc Command to start the in-game time
 * 
 * @command pause
 * @text Pauses the time
 * @desc Command to pause the in-game time
 * 
 * @command resume
 * @text Resumes the time
 * @desc Command to resume the in-game time
 * 
 * @command setMinutes
 * @text Set minutes
 * @desc Will set the minutes for the in-game time.
 * 
 * @arg minutes
 * @type number
 * @min 0
 * @max 59
 * @text Minutes
 * @desc The number of minutes to set
 * 
 * @command setHours
 * @text Set hours
 * @desc Will set the hours for the in-game time.
 * 
 * @arg hours
 * @type number
 * @min 0
 * @max 23
 * @text Hours
 * @desc The number of hours to set
 * 
 * @command setDays
 * @text Set days
 * @desc Will set the days for the in-game time.
 * 
 * @arg days
 * @type number
 * @min 1
 * @text Days
 * @desc The number of days to set
 * 
 * @command addMinutes
 * @text Add minutes
 * @desc Will add minutes for the in-game time. Can add a negative number of minutes
 *       to descrease the time. If the minutes drops bellow 0 or rise above 59, the hours
 *       will change accordingly
 * 
 * @arg nbMinutes
 * @type number
 * @min -60
 * @text Number of minutes
 * @desc The number of minutes to set. If negative, will act like a substraction.
 * 
 * @command addHours
 * @text Add hours
 * @desc Will set the hours for the in-game time. Can add a negative number of hours
 *       to descrease the time. If the hours drops bellow 0 or rise above 23, the fays
 *       will change accordingly. (Days bellow 1 will be set to 1, see `setDays` command)
 * 
 * @arg nbHours
 * @type number
 * @min -24
 * @text Number of hours
 * @desc The number of hours to set. If negative, will act like a substraction.
 * 
 * @command addDays
 * @text Add days
 * @min -100
 * @desc Will set the days for the in-game time. Can add a negative number of days
 *       to descrease the time. If the days drops bellow 1 they will be set to 1, as
 *       days count can't be 0 or negative.
 * 
 * @arg nbDays
 * @type number
 * @text Number of days
 * @desc The number of days to set
 * 
 * @command displayTimeSelection
 * @text Display time selection
 * @desc Displays an input window to change the time
 */

Kuchulem.GameTime.pluginName = "Kuchulem_GameTime",

(() => {
    const pluginName = Kuchulem.GameTime.pluginName;

    //#region Kuchulem.GameTime.Time class definition
    /**
     * Defines a time.
     * 
     * @class
     * @constructor
     * @param {number} hours Should be between 0 and 23, if not will be set to 0 or 23. 
     * @param {number} minutes Should be between 0 and 59, if not will be set to 0 or 59.
     */
    Kuchulem.GameTime.Time = function(hours, minutes) {
        this._hours = hours;
        this._minutes = minutes;
    }

    /**
     * The hours part of the time.
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Time.prototype.hours = function() { return this._hours; }

    /**
     * The minutes part of the time
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Time.prototype.minutes = function() { return this._minutes; }

    /**
     * Converts the time to a number of minutes (for comparison)
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Time.prototype.toMinutes = function() { 
        return this._hours * 60 + this._minutes;
    }

    /**
     * Parse JSON data to a time object
     * 
     * @param {string} json 
     * @returns {Kuchulem.GameTime.Time}
     */
    Kuchulem.GameTime.Time.fromJson = function(json) {
        var parsed = JSON.parse(json);
        return new Kuchulem.GameTime.Time(Number(parsed.hours), Number(parsed.minutes));
    }

    /**
     * Parse array data to a time object
     * 
     * @param {number[]} time 
     * @returns {Kuchulem.GameTime.Time}
     */
    Kuchulem.GameTime.Time.fromArray = function(time) {
        return new Kuchulem.GameTime.Time(Number(time[0]), Number(time[1]));
    }
    //#endregion

    //#region Sprite_Clock class definition
    /**
     * Sprite_Clock
     * 
     * Sprite drawing a clock in the bottom left of the game screen, displaying the
     * in-game day and time 
     * 
     * @class
     * @constructor
     */
    function Sprite_Clock() {
        this.initialize(...arguments);
    }
    Sprite_Clock.prototype = Object.create(Sprite_Timer.prototype);
    Sprite_Clock.prototype.constructor = Sprite_Clock;

    /**
     * Initializes the clock with default values
     */
    Sprite_Clock.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._minutes = null;
        this._hours = null;
        this._days = null;
        this.createBitmap();
        this.update();
    };

    /**
     * Creates the Bitmap that will hold the sprite
     */
    Sprite_Clock.prototype.createBitmap = function() {
        this.bitmap = new Bitmap(144, 48);
        this.bitmap.fontFace = this.fontFace();
        this.bitmap.fontSize = this.fontSize();
        this.bitmap.outlineColor = ColorManager.outlineColor();
    };

    /**
     * Updates the sprite on new frame
     */
    Sprite_Clock.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.updateBitmap();
        this.updatePosition();
        this.updateVisibility();
    };

    /**
     * Updates the bitmap on new frame
     */
    Sprite_Clock.prototype.updateBitmap = function() {
        if (
            this._days !== $gameClock.days() ||
            this._hours !== $gameClock.hours() ||
            this._minutes !== $gameClock.minutes()
        ) {
            this._days = $gameClock.days();
            this._hours = $gameClock.hours();
            this._minutes = $gameClock.minutes();
            this.redraw();
        }
    };

    /**
     * Redraws the bitmap content
     */
    Sprite_Clock.prototype.redraw = function() {
        const text = this.timerClock();
        const width = this.bitmap.width;
        const height = this.bitmap.height;
        this.bitmap.clear();
        this.bitmap.drawText(text, 0, 0, width, height, "left");
    };

    /**
     * Generates the text for the clock
     * 
     * @returns {string}
     */
    Sprite_Clock.prototype.timerClock = function() {
        return `Day ${this._days} ${String(this._hours).padZero(2)}:${String(this._minutes).padZero(2)}`;
    };

    /**
     * Updates the position of the clock
     */
    Sprite_Clock.prototype.updatePosition = function() {
        this.x = 24;
        this.y = Graphics.height - this.bitmap.height - 24;
    };

    /**
     * Updates the visibility of the clock
     */
    Sprite_Clock.prototype.updateVisibility = function() {
        this.visible = SceneManager._scene instanceof Scene_Map && SceneManager.isNextScene(Scene_Map) !== false;
    };
    //#endregion

    //#region Kuchulem.GameTime.Clock class definition
    /**
     * Kuchulem.GameTime.Clock
     * 
     * Class to manage in-game time
     * 
     * @class
     * @constructor
     */
    Kuchulem.GameTime.Clock = function() {
        this.initialize(...arguments);
    }

    /**
     * Initializes the clock
     */
    Kuchulem.GameTime.Clock.prototype.initialize = function() {
        this._hours = 0;
        this._minutes = 0;
        this._days = 1;
        this._paused = true;
        this._pausedByUser = true;
        this._frames = 0;
        this._framesPerMinute = 300;
        this._minutesVariableId = null;
        this._hoursVariableId = null;
        this._daysVariableId = null;
        this._displaySpan = 1;
    }

    /**
     * Gets the hours part of the time
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Clock.prototype.hours = function() { return this._hours; }

    /**
     * Gets the minutes part of the time
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Clock.prototype.minutes = function() { 
        return parseInt(this._minutes / this._displaySpan) * this._displaySpan;
    }

    /**
     * Gets the days part of the time
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Clock.prototype.days = function() { return this._days; }

    /**
     * Gets the time (hours and minutes spaned) of the day
     * 
     * @returns {Kuchulem.GameTime.Time}
     */
    Kuchulem.GameTime.Clock.prototype.time = function() { 
        return new Kuchulem.GameTime.Time(this.hours(), this.minutes());
    }

    /**
     * Gets the time (hours and minutes) of the day
     * 
     * @returns {Kuchulem.GameTime.Time}
     */
    Kuchulem.GameTime.Clock.prototype.realTime = function() { 
        return new Kuchulem.GameTime.Time(this.hours(), this._minutes);
    }

    /**
     * Gets the number of frames per in-game minutes
     * 
     * @returns {number}
     */
    Kuchulem.GameTime.Clock.prototype.framesPerMinute = function() { return this._framesPerMinute; }

    /**
     * Gets if the clock is paused
     * 
     * @returns {boolean}
     */
    Kuchulem.GameTime.Clock.prototype.paused = function() { return this._paused }

    /**
     * Sets the minutes part of the time
     * 
     * @param {number} minutes 
     */
    Kuchulem.GameTime.Clock.prototype.setMinutes = function(minutes) {
        this._minutes = 0;
        this.addMinutes(minutes);
    }

    /**
     * Sets the hours part of the time
     * 
     * @param {number} hours 
     */
    Kuchulem.GameTime.Clock.prototype.setHours = function(hours) {
        this._hours = 0;
        this.addHours(hours);
    }

    /**
     * Sets the days part of the time
     * 
     * @param {number} days 
     */
    Kuchulem.GameTime.Clock.prototype.setDays = function(days) {
        this._days = 0;
        this.addDays(days);
    }

    /**
     * Sets the number of frames in one in-game minute
     * 
     * @param {number} framesPerMinute 
     */
    Kuchulem.GameTime.Clock.prototype.setFramesPerMinute = function(framesPerMinute) {
        if(framesPerMinute < 1) {
            throw ["InvalidFrames", this, `${framesPerMinute} is an invalid number of frames (should be greater than 0)`]
        }
        this._framesPerMinute = framesPerMinute;
    }

    /**
     * Sets the minutes display span. Reprents the number of minutes for the clock
     * display to change.
     * ie: if set to 1, the clock will change on every minute and display
     * 8:01, 8:02, 8:03, etc. If set to 15 the clock display will change every
     * 15 minutes and display 8:00, 8:15, 8:30, 8:45, etc.
     * 
     * @param {number} displaySpan 
     */
    Kuchulem.GameTime.Clock.prototype.setDisplaySpan = function(displaySpan) {
        this._displaySpan = displaySpan;
    }

    /**
     * Sets the IDs of the game variables that will store the time for use in events
     * 
     * @param {number} minutesVariableId 
     * @param {number} hoursVariableId 
     * @param {number} daysVariableId 
     */
    Kuchulem.GameTime.Clock.prototype.setVariablesIds = function(minutesVariableId, hoursVariableId, daysVariableId) {
        this._minutesVariableId = minutesVariableId > 0 ? minutesVariableId : null;
        this._hoursVariableId = hoursVariableId > 0 ? hoursVariableId : null;
        this._daysVariableId = daysVariableId > 0 ? daysVariableId : null;
    }

    /**
     * Refreshes the clock on each frame
     */
    Kuchulem.GameTime.Clock.prototype.refresh = function() {
        if (
            ((SceneManager.isNextScene(Scene_Map) === false) || !(SceneManager._scene instanceof Scene_Map)) && !this._paused) {
            this.pause(false);
        } else if (this._paused && !this._pausedByUser) {
            this.resume();
        }

        if (this._paused) {
            return;
        }

        this._frames += 1;
        if ((this._frames % this._framesPerMinute) === 0) {
            this._frames = 0;
            this.addMinutes(1);
        }
    }

    /**
     * Adds minutes to the clock. Can add a negative number to substract minutes
     * from the clock
     * 
     * @param {number} nbMinutes 
     */
    Kuchulem.GameTime.Clock.prototype.addMinutes = function(nbMinutes) {
        const minutes = this._minutes + nbMinutes;
        if (minutes >= 60) {
            this._minutes = minutes % 60;
            this.addHours(parseInt(minutes / 60));        
        } else if (minutes < 0) {
            this._minutes = 60 + (minutes % 60);
            this.addHours(parseInt(minutes / 60) - 1);        
        } else {
            this._minutes = minutes;
        }
        this._saveMinutes();
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.realMinutesTick, this);
        if ((this._minutes % this._displaySpan) === 0) {
            $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.minutesTick, this);
        }
    }

    /**
     * Adds hours to the clock. Can add an negative number to substract hours from
     * the clock
     * 
     * @param {number} nbHours 
     */
    Kuchulem.GameTime.Clock.prototype.addHours = function(nbHours) {
        const hours = this._hours + nbHours;
        if (hours >= 24) {
            this._hours = hours % 24;
            this.addDays(parseInt(hours / 24));        
        } else if (hours < 0) {
            this._hours = 24 + (hours % 24);
            this.addDays(parseInt(hours / 24) - 1);     
        } else {
            this._hours = hours;   
        }
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.hoursTick, this);
        this._saveHours();
    }

    /**
     * Adds days to the clock. Can add a negative number to substract days from the
     * clock. The the clock's days turn 0 or less, the day is set to 1 and the
     * clock is reseted.
     * 
     * @param {number} nbDays 
     */
    Kuchulem.GameTime.Clock.prototype.addDays = function(nbDays) {
        this._days += nbDays;
        if (this._days < 1) {
            this.reset();
        } else {
            $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.daysTick, this);
            this._saveDays();
        }
    }

    /**
     * Pauses the clock
     */
    Kuchulem.GameTime.Clock.prototype.pause = function(byUser = true) {
        this._paused = true;
        this._pausedByUser = byUser;
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.paused, this);
    }

    /**
     * Resumes or starts the clock
     */
    Kuchulem.GameTime.Clock.prototype.resume = function() {
        this._paused = false;
        if (!this._started) {
            $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.resumed, this);
            this._started = true;
        } else {
            $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.started, this);
        }
    }

    /**
     * Resets the clock to "Day 1 00:00"
     */
    Kuchulem.GameTime.Clock.prototype.reset = function() {
        this.initialize();
        this._saveTime();
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.daysTick, this);
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.hoursTick, this);
        $eventsPublisher.publish(Kuchulem.GameTime.Clock.events.minutesTick, this);
    }

    Kuchulem.GameTime.Clock.events = {
        started: "started",
        paused: "paused",
        resumed: "resumed",
        minutesTick: "minutesTick",
        realMinutesTick: "realMinutesTick",
        hoursTick: "hoursTick",
        daysTick: "daysTick"
    };

    Kuchulem.GameTime.Clock.prototype._saveMinutes = function() {
        if (this._minutesVariableId !== null) {
            $gameVariables.setValue(this._minutesVariableId, this._minutes);
        }
    }

    Kuchulem.GameTime.Clock.prototype._saveHours = function() {
        if (this._hoursVariableId !== null) {
            $gameVariables.setValue(this._hoursVariableId, this._hours);
        }
    }

    Kuchulem.GameTime.Clock.prototype._saveDays = function() {
        if (this._daysVariableId !== null) {
            $gameVariables.setValue(this._daysVariableId, this._days);
        }
    }

    Kuchulem.GameTime.Clock.prototype._saveTime = function() {
        this._saveMinutes();
        this._saveHours();
        this._saveDays();
    }
    //#endregion

    //#region Game object : $gameClock
    Kuchulem.createGameObject("$gameClock", new Kuchulem.GameTime.Clock(), true);
    //#endregion

    //#region Events
    $eventsPublisher.on(Spriteset_Base.events.beforeCreateUpperLayer, Spriteset_Base, spriteset => {
        spriteset._clock = new Sprite_Clock();
        spriteset.addChild(spriteset._clock);
    });
    
    $eventsPublisher.on(Game_Map.events.beforeUpdate, Game_Map, () => {
        $gameClock.refresh();
    });
    //#endregion

    //#region Configure clock with parameters
    const parameters = PluginManager.parameters(pluginName);

    const framesPerMinute = Number(parameters.framesPerMinute);
    const displaySpan = Number(parameters.displaySpan);
    const hoursVariableId = Number(parameters.hoursVariableId);
    const minutesVariableId = Number(parameters.minutesVariableId);
    const daysVariableId = Number(parameters.daysVariableId);

    $gameClock.setFramesPerMinute(framesPerMinute);
    $gameClock.setDisplaySpan(displaySpan);
    $gameClock.setVariablesIds(minutesVariableId, hoursVariableId, daysVariableId);
    //#endregion

    //#region Register commands
    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "start", () => {
        $gameClock.resume();
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "pause", () => {
        $gameClock.pause();
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "resume", () => {
        $gameClock.resume();
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "setMinutes", (args) => {
        const minutes = Number(args.minutes);
        $gameClock.setMinutes(minutes);
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "setHours", (args) => {
        const hours = Number(args.hours);
        $gameClock.setHours(hours);
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "setDays", (args) => {
        const days = Number(args.days);
        $gameClock.setDays(days);
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "addMinutes", (args) => {
        const minutes = Number(args.nbMinutes);
        $gameClock.addMinutes(minutes);
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "addHours", (args) => {
        const hours = Number(args.nbHours);
        $gameClock.addHours(hours);
    });

    PluginManager.registerCommand(Kuchulem.GameTime.pluginName, "addDays", (args) => {
        const days = Number(args.nbDays);
        $gameClock.addDays(days);
    });
    //#endregion
})();