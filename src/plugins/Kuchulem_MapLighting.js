if (!Kuchulem) {
    throw new Error("Kuchulem_MapLighting requires Kuchulem plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Manages lightings in a map.
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * @base Kuchulem_Events
 * @base Kuchulem_Areas
 * @base Kuchulem_GameTime
 *
 * @help Kuchulem_MapLighting.js
 * 
 * Adds mechanics to setup lighting in a map.
 * Lighting includes :
 *   - global lighting : the light to apply to the whole map
 *   - player lighting : a light source that follows the player and is enabled
 *     or disabled from a switch
 *   - player sight : circle around the player where opacity is modified to
 *     simulate night vision
 *   - areas lighting : map areas can have their own lighting
 *   - light sources : sources of light that lighten a dark area
 *   - highlights : lighting that displays a bright colored light
 * 
 * @param defaultLighting
 * @text Default global lighting
 * @type struct<lightingStep>[]
 * @desc The list of light steps that defines the default global lighting, like
 * a day/night cycle.
 * 
 * @param defaultPlayerSight
 * @text Default player sight
 * @type struct<playerSight>
 * @desc The default player sight
 * 
 * @param playerLights
 * @text Player lights
 * @type struct<lightSource>[]
 * @desc The list of plyer lights available in the game.
 * 
 * @command setLightSource
 * @text Set light source
 * @desc Sets a light source and an highlight on this event location. Once set
 *       the light wont move, even if the event moves.
 * 
 * @arg lightSource
 * @text Light source
 * @type struct<lightSource>
 * @desc The light source to place on that event current location
 * 
 * @command setGlobalLighting
 * @text Set global lighting
 * @desc Sets the global lighting for the current map.
 * 
 * @arg lightingSteps
 * @text Lighting steps
 * @type struct<lightingStep>[]
 * @desc The list of steps that define the lighting cycle for the map.
 * 
 * @command setPlayerSight
 * @text Set player sight
 * @desc Sets the player sight for that map.
 * 
 * @arg radius
 * @text Radius
 * @type number
 * @min 0
 * @decimals 2
 * @desc The max distance that the player can see.
 * 
 * @arg brightness
 * @text Brightness
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @desc The higher the value the more the circle aroud the player is transparent.
 */
//#region structs

/*~struct~color:
 *
 * @param red
 * @text Red
 * @type number
 * @min 0
 * @max 255
 * @desc Amount of red light in the color
 *
 * @param green
 * @text Green
 * @type number
 * @min 0
 * @max 255
 * @desc Amount of green light in the color
 *
 * @param blue
 * @text Blue
 * @type number
 * @min 0
 * @max 255
 * @desc Amount of blue light in the color
 *
 * @param alpha
 * @text Alpha
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @desc Opacity of the color
 */

/*~struct~time:
 *
 * @param hours
 * @text Hours
 * @type number
 * @min 0
 * @max 23
 * @desc Hours part of the time
 *
 * @param minutes
 * @text Minutes
 * @type number
 * @min 0
 * @max 59
 * @desc Minutes part of the time
 */

/*~struct~lightingStep:
 *
 * @param time
 * @text Time
 * @type struct<time>
 * @desc Time for the lighting step
 * 
 * @param color
 * @text Color
 * @type struct<color>
 * @desc The colors of that lighting step
 */

/*~struct~playerSight:
 *
 * @param radius
 * @text Radius
 * @type number
 * @min 0
 * @decimals 1
 * @desc The radius of the player sight
 *
 * @param brightness
 * @text Brightness
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @desc Real between 0 and 1. The higher the brighter.
 */

/*~struct~lightSource:
 *
 * @param name
 * @text Name
 * @type string
 * @desc A unique name for the light source
 * 
 * @param shape
 * @text Shape
 * @type combo
 * @option circle
 * @option rectangle
 * @desc The shape of the light source. If circle is selected the width 
 *       argument will define the radius and the height won't be used.
 * 
 * @param width
 * @text Width or radius
 * @type number
 * @min 0
 * @decimals 1
 * @desc Width or radius of the light source (in number of tiles). You can use
 *       a real number (1, 2.5, etc.)
 * 
 * @param height
 * @text Height
 * @type number
 * @min 0
 * @decimals 1
 * @desc height of the light source (in number of tiles). You can use a real 
 *       number (1, 2.5, etc.). Not used if shape is "circle".
 * 
 * @param brightness
 * @text Brightness
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @desc The brightness of the light source. Will reduce the opacity of the
 *       global lighting depending on this value.
 * 
 * @param highlightColor
 * @text Highlight color
 * @type struct<color>
 * @desc The color of the highlight for this light source.
 * 
 * @param switch
 * @text Switch
 * @type switch
 * @desc The switch that will determine if the lightsource is on
 */

//#endregion

//#region Sprite_Light class definition
/**
 * Sprite_Light
 * Generates an overlay image that darkens and ligthens parts of the map based 
 * on the in-game time and light steps.
 * 
 * @class
 * @constructor
 */
function Sprite_Lights() {
    this.initialize(...arguments);
}

Sprite_Lights.prototype = Object.create(Sprite.prototype);
Sprite_Lights.prototype.constructor = Sprite_Lights;

/**
 * Initializes the sprite
 */
Sprite_Lights.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._areasPositions = {};
    this._lightSourcesPositions = {};
    this._highlightsPositions = {};
    this._playerSightPosition = {};
    this._playerLightPositions = {};
    this._globalColor = null;
    this._areaColors = [];
    $eventsPublisher.on(Kuchulem_GameTime_Clock.events.updated, Kuchulem_GameTime_Clock, this._resetLighting, this);
    this.createBitmap();
    this.update();
};

Sprite_Lights.prototype._resetLighting = function() {
    this._globalColor = null;
    this._areaColors = [];
};

/**
 * Destroys the sprite
 * 
 * @param {*} options 
 */
Sprite_Lights.prototype.destroy = function(options) {
    $eventsPublisher.off(Kuchulem_GameTime_Clock.events.updated, Kuchulem_GameTime_Clock, this._resetLighting);
    this.bitmap.destroy();
    Sprite.prototype.destroy.call(this, options);
};

/**
 * Creates the bitmap for the overlay
 */
Sprite_Lights.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(Graphics.width, Graphics.height);
};

/**
 * Updates the sprite
 */
Sprite_Lights.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updatePosition();
    this.updateBitmap();
    this.updateVisibility();
};

/**
 * Updates the sprite position in the screen
 */
Sprite_Lights.prototype.updatePosition = function() {
    this.x = 0;
    this.y = 0;
    $gameMap.areas().forEach(a => {
        this.updateAreaPosition(a);
    });
    $gameMap.lighting().lightSources().forEach(ls => 
        this.updateLightSourcePosition(ls)
    );
    $gameMap.lighting().highlights().forEach(ls => 
        this.updateHighlightPosition(ls)
    );
    this.updatePlayerSightPosition($gameMap.lighting().playerSight());
    $gameMap.lighting().playerLights().forEach(ls => 
        this.updatePlayerLightPosition(ls)
    );
};

Sprite_Lights.prototype.getAreaFixedPosition = function(x, y, width, height, shouldDraw = true) {
    const fixedX = x - $gameMap.displayX() * $dataSystem.tileSize;
    const fixedY = y - $gameMap.displayY() * $dataSystem.tileSize;
    const fixedWidth = width * $dataSystem.tileSize;
    const fixedHeight = height * $dataSystem.tileSize;
    return {
        x: fixedX,
        y: fixedY,
        width: fixedWidth,
        height: fixedHeight,
        shouldDraw: true
    }
};

Sprite_Lights.prototype.getLightFixedPosition = function(lightSource) {
    if (!lightSource || !lightSource.isOn()) {
        return {
            shouldDraw: false
        };
    }

    const fixedWidth = lightSource.width() * $dataSystem.tileSize;
    const fixedHeight = lightSource.height() * $dataSystem.tileSize;
    const divider = lightSource.shape() === "circle" ? 1 : 2;
    const fixedX = lightSource.x() - fixedWidth / divider;
    const fixedY = lightSource.y() - fixedHeight / divider;

    return {
        x: fixedX,
        y: fixedY,
        width: fixedWidth,
        height: fixedHeight,
        shouldDraw: true
    }
};

Sprite_Lights.prototype.updateAreaPosition = function(area) {
    this._areasPositions[area.id] = this.getAreaFixedPosition(
        area.x * $dataSystem.tileSize, area.y * $dataSystem.tileSize, 
        area.width, area.height,
        false
    );
}

Sprite_Lights.prototype.updateLightSourcePosition = function(lightSource) {
    this._lightSourcesPositions[lightSource.name()] = this.getLightFixedPosition(lightSource);
};

Sprite_Lights.prototype.updateHighlightPosition = function(highlight) {
    this._highlightsPositions[highlight.name()] = this.getLightFixedPosition(highlight);
};

Sprite_Lights.prototype.updatePlayerSightPosition = function(playerSight) {
    if (!playerSight) {
        this._playerSightPosition = {
            shouldDraw: false
        };
        return;
    }
    
    const fixedWidth = playerSight.radius() * $dataSystem.tileSize;
    const fixedHeight = playerSight.radius() * $dataSystem.tileSize;
    this._playerSightPosition = {
        x: parseInt($gamePlayer.screenX() - fixedWidth),
        y: parseInt($gamePlayer.screenY() - fixedHeight - $dataSystem.tileSize / 2),
        width: fixedWidth,
        height: fixedHeight,
        shouldDraw: true
    }
};

Sprite_Lights.prototype.updatePlayerLightPosition = function(playerLight) {
    this._playerLightPositions[playerLight.lightSource.name()] = this.getLightFixedPosition(playerLight.lightSource);
};

/**
 * Updates the bitmap. Creates a default overlay and redraws parts of the overlay
 * for the different areas in the map
 */
Sprite_Lights.prototype.updateBitmap = function() {
    this.bitmap.clear();
    this._globalColor = $gameMapLighting.getFrameColor($gameMap.lighting().global(), this._globalColor);
    if (this._globalColor) {
        this.bitmap.fillAll(this._globalColor.toRgba());
    }
    if ($gameMap.lighting().playerSight()) {
        this.drawPlayerSight($gameMap.lighting().playerSight());
    }
    $gameMap.lighting().lightSources().forEach(ls => {
        this.drawLightSource(ls);
    });
    $gameMap.lighting().playerLights().forEach(pl => {
        this.drawPlayerLight(pl);
    });
    $gameMap.lighting().highlights().forEach(ls => {
        this.drawHighlight(ls);
    });
};

/**
 * Draws a light source on the sprite
 * 
 * @param {Kuchulem_MapLighting_LightSource} lightSource 
 */
Sprite_Lights.prototype.drawLightSource = function(lightSource) {

    const fixedPosition = this._lightSourcesPositions[lightSource.name()];

    if (!fixedPosition.shouldDraw) {
        return;
    }

    this.drawLight(fixedPosition, lightSource.color(), lightSource.shape());
};

/**
 * Draws a highlight on the sprite
 * 
 * @param {Kuchulem_MapLighting_LightSource} highlight 
 */
Sprite_Lights.prototype.drawHighlight = function(highlight) {

    const fixedPosition = this._highlightsPositions[highlight.name()];

    if (!fixedPosition.shouldDraw) {
        return;
    }

    this.drawLight(fixedPosition, highlight.color(), highlight.shape(), "hard-light");
};

Sprite_Lights.prototype.drawPlayerSight = function(playerSight) {
    if (!this._playerSightPosition.shouldDraw) {
        return;
    }
    
    const color = new Kuchulem_MapLighting_Color(0, 0, 0, playerSight.brightness());
    this.drawLight(this._playerSightPosition, color, "circle", "destination-out");
};

Sprite_Lights.prototype.drawPlayerLight = function(playerLight) {
    const fixedPosition = this._playerLightPositions[playerLight.lightSource.name()];

    if (!fixedPosition.shouldDraw) {
        return;
    }
    
    this.drawLight(this._playerLightPositions[playerLight.lightSource.name()], playerLight.lightSource.color(), playerLight.lightSource.shape(), "destination-out");
    this.drawLight(this._playerLightPositions[playerLight.lightSource.name()], playerLight.highlight.color(), playerLight.lightSource.shape(), "hard-light");
};

/**
 * Draws a light source on the sprite
 * 
 * @param {Kuchulem_MapLighting_LightSource} lightSource 
 */
Sprite_Lights.prototype.drawLight = function(position, color, shape, operation="destination-out") {

    if (!position.shouldDraw) {
        return;
    }
    this.bitmap.context.save();
    const previousOperation = this.bitmap.context.globalCompositeOperation;
    this.bitmap.context.globalCompositeOperation = operation
    switch (shape) {
        case "rectangle": 
            this.bitmap.fillRect(
                position.x, position.y, 
                position.width, position.height, 
                color.toRgba()
            );
            break;
        case "circle":
            const centerX = position.x + position.width;
            const centerY = position.y + position.width;
            var area = $gameMap.areas().first(a => a.isInside(centerX / $dataSystem.tileSize, centerY / $dataSystem.tileSize));
            if (!!area) {
                const areas = $gameMap.areas().filter(a => a.name === area.name);
                const region = new Path2D();
                areas.forEach(a => {
                    const areaPosition = this._areasPositions[a.id]
                    region.rect(areaPosition.x, areaPosition.y, areaPosition.width, areaPosition.height);
                });
                this.bitmap.context.clip(region);
            } 
            const gradient = this.bitmap.context.createRadialGradient(
                centerX, centerY, position.width / 3, centerX, centerY, position.width - 1);

            gradient.addColorStop(0, color.toRgba());
            gradient.addColorStop(1, color.toRgba(0));
            this.bitmap.context.fillStyle = gradient;
            this.bitmap.context.beginPath();
            this.bitmap.context.arc(centerX, centerY, position.width, 0, Math.PI * 2);
            this.bitmap.context.fill();
            break;
        default:
            throw ["InvalidLight", lightSource.shape(), "Invalid light shape"]
    }
    this.bitmap.context.globalCompositeOperation = previousOperation
    this.bitmap.context.restore();
};

/**
 * Updates the sprite visibility. The sprite will only be displayed on a map
 * scene
 */
Sprite_Lights.prototype.updateVisibility = function() {
    this.visible = SceneManager._scene instanceof Scene_Map;
};

/**
 * Returns trus if the sprite should be updated
 * 
 * @returns {boolean}
 */
Sprite_Lights.prototype._shouldUpdate = function() {
    return (
        SceneManager._scene instanceof Scene_Map
    );
};
//#endregion

//#region Kuchulem_MapLighting_Color class definition

//#region Kuchulem_MapLighting class definition 
/**
 * Game object that holds the default configuration
 * 
 * @class
 * @constructor
 * 
 * @param {object} parameters 
 */
function Kuchulem_MapLighting(parameters) {
    this.initialize(parameters);
}

Kuchulem_MapLighting.prototype.initialize = function(parameters) {
    const defaultLightingParam = JSON.parse(parameters.defaultLighting);
    const sightParam = JSON.parse(parameters.defaultPlayerSight);
    const playerLightsParam = JSON.parse(parameters.playerLights);

    this._defaultLighting = defaultLightingParam.map(ls => {
        const step = JSON.parse(ls);
        const time = JSON.parse(step.time);
        return new Kuchulem_MapLighting_LightStep(
            new Kuchulem_GameTime_Time(Number(time.hours), Number(time.minutes)),
            Kuchulem_MapLighting_Color.fromJson(step.color)
        );
    });

    this._defaultPlayerSight =  new Kuchulem_MapLighting_PlayerSight(Number(sightParam.radius), Number(sightParam.brightness));
    
    this._playerLights = playerLightsParam.map(pl => {
        const light = JSON.parse(pl);
        const highlightColor = JSON.parse(light.highlightColor);
        return {
            lightSource: new Kuchulem_MapLighting_LightSource(
                light.name || `Kuchulem_playerLight_${index + 1}`, 
                "$gamePlayer",
                light.shape, 
                Number(light.width), Number(light.height), 
                new Kuchulem_MapLighting_Color(255, 255, 255, Number(light.brightness)),
                Number(light.switch)
            ),
            highlight: new Kuchulem_MapLighting_LightSource(
                light.name || `Kuchulem_playerLight_${index + 1}`, 
                "$gamePlayer",
                light.shape, 
                Number(light.width), Number(light.height), 
                new Kuchulem_MapLighting_Color(
                    Number(highlightColor.red), 
                    Number(highlightColor.green), 
                    Number(highlightColor.blue), 
                    Number(highlightColor.alpha)),
                Number(light.switch)
            )
        }
    });
    this._mapsLightings = [];
};


/**
 * The default player sight
 * 
 * @returns {Kuchulem_MapLighting_PlayerSight}
 */
Kuchulem_MapLighting.prototype.defaultPlayerSight = function() { return this._defaultPlayerSight; };

/**
 * The default lighting
 *
 * @returns {Kuchulem_MapLighting_LightStep[]}
 */
Kuchulem_MapLighting.prototype.defaultLighting = function() { return this._defaultLighting; };

/**
 * The player lights
 *
 * @returns {Kuchulem_MapLighting_LightSource[]}
 */
Kuchulem_MapLighting.prototype.playerLights = function() { return this._playerLights; };

Kuchulem_MapLighting.prototype.getMapLighting = function(mapId) {
    if (!this._mapsLightings.any(ml => ml.mapId() === mapId)) {
        this._mapsLightings.push(Kuchulem_MapLighting_Lighting.load(mapId));
    }

    return this._mapsLightings.first(ml => ml.mapId() === mapId);
}

/**
 * Calculates the color for the provided time
 * 
 * @param {Kuchulem_GameTime_Time} time 
 * @param {Kuchulem_MapLighting_LightStep} previousStep 
 * @param {Kuchulem_MapLighting_LightStep} nextStep 
 * @returns {Kuchulem_MapLighting_Color}
 */
Kuchulem_MapLighting.prototype.calculateFrameColorChange = function(previousStep, nextStep) {
    const nbFrames = (nextStep.time().toMinutes() - previousStep.time().toMinutes()) * $gameClock.framesPerMinute;
    return [
        parseFloat((nextStep.color().red() - previousStep.color().red()) / nbFrames),
        parseFloat((nextStep.color().green() - previousStep.color().green()) / nbFrames),
        parseFloat((nextStep.color().blue() - previousStep.color().blue()) / nbFrames),
        parseFloat((nextStep.color().alpha() - previousStep.color().alpha()) / nbFrames),
    ];
};

/**
 * Computes the color for the actual frame
 * 
 * @param {Kuchulem_MapLighting_LightStep[]} steps 
 * @param {Kuchulem_MapLighting_Color} previousColor 
 * 
 * @return {Kuchulem_MapLighting_Color}
 */
Kuchulem_MapLighting.prototype.getFrameColor = function(steps, previousColor) {
    const time = $gameClock.realTime();
    const sortedSteps = steps.sort((a, b) => a.time().toMinutes() - b.time().toMinutes());
    if (!sortedSteps.any()) {
        return;
    }

    let currentStep = sortedSteps.first(s => s.time().toMinutes() === time.toMinutes());

    if (currentStep) {
        return currentStep.color();    
    }

    const previousStep = this.getPreviousStep(time, sortedSteps);
    const nextStep = this.getNextStep(time, sortedSteps);

    if (!previousColor) {
        previousColor = previousStep.color();
    }
    var change = this.calculateFrameColorChange(previousStep, nextStep);

    return new Kuchulem_MapLighting_Color(
        (previousColor.red() + change[0]).clamp(0, 255),
        (previousColor.green() + change[1]).clamp(0, 255),
        (previousColor.blue() + change[2]).clamp(0, 255),
        (previousColor.alpha() + change[3]).clamp(0, 1),
    );
};

/**
 * Gets the previous light step from a list of steps
 * 
 * @param {Kuchulem_GameTime_Time} time 
 * @param {Kuchulem_MapLighting_LightStep[]} sortedSteps The light steps of the area, sorted by time
 * @returns {Kuchulem_MapLighting_LightStep}
 */
Kuchulem_MapLighting.prototype.getPreviousStep = function(time, sortedSteps) {
    const lastStep = sortedSteps.last();
    return sortedSteps.last(s => s.time().toMinutes() <= time.toMinutes()) ??
        new Kuchulem_MapLighting_LightStep(
            new Kuchulem_GameTime_Time(
                lastStep.time().hours - $dataSystem.tileSize / 2, lastStep.time().minutes), 
                lastStep.color()
        );
};

/**
 * Gets the next light step from a list of steps
 * 
 * @param {Kuchulem_GameTime_Time} time The current in-game time
 * @param {Kuchulem_MapLighting_LightStep[]} sortedSteps The light steps of the area, sorted by time
 * @returns {Kuchulem_MapLighting_LightStep}
 */
Kuchulem_MapLighting.prototype.getNextStep = function(time, sortedSteps) {
    const firstStep = sortedSteps.first();
    return sortedSteps.first(s => s.time().toMinutes() > time.toMinutes()) ??
        new Kuchulem_MapLighting_LightStep(
            new Kuchulem_GameTime_Time(
                firstStep.time().hours + $dataSystem.tileSize / 2, firstStep.time().minutes), 
            firstStep.color()
        );
};
//#endregion

/**
 * Represents a color 
 * 
 * @class
 * @constructor
 * @param {number} red 
 * @param {number} green 
 * @param {number} blue 
 * @param {number} alpha 
 */
function Kuchulem_MapLighting_Color(red = 0, green = 0, blue = 0, alpha = 0) {
    if (
        red <= 255 && red >= 0 &&
        green <= 255 && green >= 0 &&
        blue <= 255 && blue >= 0 &&
        alpha <= 1 && alpha >= 0
    ) {
        this._red = red;
        this._green = green;
        this._blue = blue;
        this._alpha = alpha;
    } else {
        throw ["InvalidColor", this, `An invalid value for color color was provided : ${red}, ${green}, ${blue}, ${alpha}`];
    }
}

/**
 * The amount of red in the color
 *
 * @returns {number}
 */
Kuchulem_MapLighting_Color.prototype.red = function() { return this._red; };

/**
 * The amount of green in the color
 *
 * @returns {number}
 */
Kuchulem_MapLighting_Color.prototype.green = function() { return this._green; };

/**
 * The amount of blue in the color
 *
 * @returns {number}
 */
Kuchulem_MapLighting_Color.prototype.blue = function() { return this._blue; };

/**
 * The amount of alpha in the color
 *
 * @returns {number}
 */
Kuchulem_MapLighting_Color.prototype.alpha = function() { return this._alpha; };

/**
 * Converts the color object to an array usable by $gameScreen.startTint
 * 
 * @returns {Array}
 */
Kuchulem_MapLighting_Color.prototype.toArray = function() {
    return [this._red, this._green, this._blue, this._alpha];
};

/**
 * Converts the color object to a rgba color
 * 
 * @returns 
 */
Kuchulem_MapLighting_Color.prototype.toRgba = function(forcedAlpha = null) {
    forcedAlpha = forcedAlpha === null ? this._alpha : forcedAlpha;
    return `rgba(${parseInt(this._red)}, ${parseInt(this._green)}, ${parseInt(this._blue)}, ${forcedAlpha})`;
};

/**
 * Converts the color object to a rgb color
 * 
 * @returns 
 */
Kuchulem_MapLighting_Color.prototype.toRgb = function() {
    return `rgb(${parseInt(this._red)}, ${parseInt(this._green)}, ${parseInt(this._blue)})`;
};

/**
 * Parse JSON data to a Color object
 * 
 * @param {string} color 
 * @returns {Kuchulem_MapLighting_Color}
 */
Kuchulem_MapLighting_Color.fromJson = function(json) {
    const color = JSON.parse(json);
    return new Kuchulem_MapLighting_Color(
        Number(color.red), 
        Number(color.green), 
        Number(color.blue), 
        Number(color.alpha)
    );
};

/**
 * Parse array data to a Color object
 * 
 * @param {number[]} color 
 * @returns {Kuchulem_MapLighting_Color}
 */
Kuchulem_MapLighting_Color.fromArray = function(color) {
    return new Kuchulem_MapLighting_Color(
        Number(color[0]), 
        Number(color[1]), 
        Number(color[2]), 
        Number(color[3])
    );
};
//#endregion 

//#region Kuchulem_MapLighting_PlayerSight class definition
function Kuchulem_MapLighting_PlayerSight(radius, brightness) {
    this.initialize(radius, brightness);
}

Kuchulem_MapLighting_PlayerSight.prototype.initialize = function(radius, brightness) {
    this._radius = radius;
    this._brightness = brightness;
}

/**
 * The radius
 *
 * @returns {number}
 */
Kuchulem_MapLighting_PlayerSight.prototype.radius = function() { return this._radius; };
/**
 * The brightness
 * 
 * @returns {number}
 */
Kuchulem_MapLighting_PlayerSight.prototype.brightness = function() { return this._brightness; };

//#endregion

//#region Kuchulem_MapLighting_LightSource class definition
/**
 * Defines a light source
 * 
 * @class
 * @constructor
 * 
 * @param {string} name 
 * @param {Function} origin 
 * @param {string} shape 
 * @param {number} width 
 * @param {number} height 
 * @param {Kuchulem_MapLighting_Color} color,
 * @param {number} switchId 
 */
function Kuchulem_MapLighting_LightSource(
    name,
    origin,
    shape, 
    width,
    height,
    color,
    switchId) {
    this.initialize(
        name,
        origin, 
        shape, 
        width,
        height,
        color,
        switchId);
}

/**
 * Initializes the light source
 * 
 * @param {string} name 
 * @param {Function} origin 
 * @param {string} shape 
 * @param {number} width 
 * @param {number} height 
 * @param {Kuchulem_MapLighting_Color} color,
 * @param {number} switchId 
 */
Kuchulem_MapLighting_LightSource.prototype.initialize = function(
    name,
    origin,
    shape, 
    width,
    height,
    color,
    switchId
) {
    if (!["rectangle", "circle"].includes(shape)) {
        throw ["InvalidShape", shape, "Invalid shape provided"];        
    }
    this._name = name;
    this._origin = origin;
    this._shape = shape;
    this._width = width;
    this._height = height;
    this._color = color;
    this._switchId = switchId;
};

/**
 * The light source name
 *
 * @returns {string}
 */
Kuchulem_MapLighting_LightSource.prototype.name = function() { return this._name; };

/**
 * The light source origin
 *
 * @returns {object}
 */
Kuchulem_MapLighting_LightSource.prototype.origin = function() {
    if (this._origin instanceof Game_Event && this._origin["@"]) {
        this._origin = $gameMap.event(this._origin._eventId)
    }

    if (this._origin instanceof Game_Player && this._origin["@"]) {
        this._origin = $gamePlayer;
    }

    if (typeof(this._origin) === typeof("")) {
        this._origin = window[this._origin];
    }

    if (!this._origin) {
        throw ["LightSourceNullOrUndefinedOrigin", this._name, "The light source origin is null or undefined"];
    }
    
    return this._origin ;
};

/**
 * The light source X coordinate
 *
 * @returns {number}
 */
Kuchulem_MapLighting_LightSource.prototype.x = function() { return this.origin().screenX(); };

/**
 * The light source Y coordinate
 *
 * @returns {number}
 */
Kuchulem_MapLighting_LightSource.prototype.y = function() { return this.origin().screenY(); };

/**
 * The light source shape
 *
 * @returns {string}
 */
Kuchulem_MapLighting_LightSource.prototype.shape = function() { return this._shape; };

/**
 * The light source width
 *
 * @returns {number}
 */
Kuchulem_MapLighting_LightSource.prototype.width = function() { return this._width; };

/**
 * The light source height
 *
 * @returns {number}
 */
Kuchulem_MapLighting_LightSource.prototype.height = function() { return this._height; };

/**
 * The light source color
 *
 * @returns {Kuchulem_MapLighting_Color}
 */
Kuchulem_MapLighting_LightSource.prototype.color = function() { return this._color; };

/**
 * Wether the light source is ON (lighted) or OFF (unlighted)
 *
 * @returns {boolean}
 */
Kuchulem_MapLighting_LightSource.prototype.isOn = function() {
    return !this._switchId || $gameSwitches.value(this._switchId);
};
//#endregion

//#region Kuchulem_MapLighting_LightStep class definition
/**
 * Defines a light step. A light step is specific time of in-game time with
 * a specific lighting. The lighting will gradually evolve from one step to
 * another.
 * 
 * @param {Kuchulem_GameTime_Time} time 
 * @param {Kuchulem_MapLighting_Color} color 
 */
function Kuchulem_MapLighting_LightStep(time, color) {
    this.initialize(time, color);
}

Kuchulem_MapLighting_LightStep.prototype.initialize = function(time, color) {
    if (
        time instanceof Kuchulem_GameTime_Time &&
        color instanceof Kuchulem_MapLighting_Color
    ) {
        this._time = time;
        this._color = color;
    } else {
        throw ["InvalidLightStep", this, "Time or color provided is invalid"]
    }
};

/**
 * Gets the time for that step
 * 
 * @returns {number}
 */
Kuchulem_MapLighting_LightStep.prototype.time = function() { return this._time; };

/**
 * Gets the color for that step
 * 
 * @returns {number}
 */
Kuchulem_MapLighting_LightStep.prototype.color = function() { return this._color; };
//#endregion

//#region Kuchulem_MapLighting_Lighting prototype definition
/**
 * Prototype to manage lighting in the map
 * 
 * @param {number} mapId 
 * @param {Kuchulem_MapLighting_LightStep[]} globalLighting 
 * @param {object[]} playerLights
 * @param {Kuchulem_MapLighting_LightSource} playerSight 
 * @param {Kuchulem_MapLighting_LightSource[]} lightSources 
 * @param {Kuchulem_MapLighting_LightSource[]} highlights
 */
function Kuchulem_MapLighting_Lighting(mapId, globalLighting, playerLights, playerSight, lightSources, highlights) {
    this.initialize(mapId, globalLighting, playerLights, playerSight, lightSources, highlights);
}

/**
 * Initializes the lighting
 * 
 * @param {number} mapId 
 * @param {Kuchulem_MapLighting_LightStep[]} globalLighting 
 * @param {object[]} playerLights 
 * @param {Kuchulem_MapLighting_LightSource} playerSight 
 * @param {Kuchulem_MapLighting_LightSource[]} lightSources 
 * @param {Kuchulem_MapLighting_LightSource[]} highlights 
 */
Kuchulem_MapLighting_Lighting.prototype.initialize = function(mapId, globalLighting, playerLights, playerSight, lightSources, highlights) {
    this._mapId = mapId;
    this._globalLighting = globalLighting ?? [];
    this._lightSources = lightSources ?? [];
    this._highlights = highlights ?? [];
    this._playerLights = playerLights ?? null;
    this._playerSight = playerSight ?? null;
};


/**
 * The Map ID
 *
 * @returns {number}
 */
Kuchulem_MapLighting_Lighting.prototype.mapId = function() { return this._mapId; };
/**
 * The Global lighting
 * 
 * @returns {Kuchulem_MapLighting_LightStep[]}
 */
Kuchulem_MapLighting_Lighting.prototype.global = function(value) {
    if (!!value) {
        if (!(value instanceof Array) || value.any(ls => !(ls instanceof Kuchulem_MapLighting_LightStep))) {
            throw ["InvalidGlobalLighting", value, "An invalid global lighting was set to map lighting"];
        }

        this._globalLighting = value;
    }

    return this._globalLighting;
};

/**
 * The light sources
 *
 * @returns {Kuchulem_MapLighting_LightSource[]}
 */
Kuchulem_MapLighting_Lighting.prototype.lightSources = function(value) {
    if (!!value) {
        if (!(value instanceof Array) || value.any(ls => !(ls instanceof Kuchulem_MapLighting_LightSource))) {
            throw ["InvalidLightSources", value, "Invalid Light sources were set to map lighting"];
        }

        this._lightSources = value;
    }
    
    return this._lightSources;
};

/**
 * The highlights
 *
 * @returns {Kuchulem_MapLighting_LightSource[]}
 */
Kuchulem_MapLighting_Lighting.prototype.highlights = function(value) {
    if (!!value) {
        if (!(value instanceof Array) || value.any(ls => !(ls instanceof Kuchulem_MapLighting_LightSource))) {
            throw ["InvalidHighlight", value, "Invalid highlights were set to map lighting"];
        }

        this._highlights = value;
    }
    
    return this._highlights;
};

/**
 * The player light
 *
 * @returns {Kuchulem_MapLighting_LightSource[]}
 */
Kuchulem_MapLighting_Lighting.prototype.playerLights = function(value) {
    if (!!value) {
        if (!(value instanceof Array) || value.any(ls => !(ls instanceof Kuchulem_MapLighting_LightSource))) {
            throw ["InvalidPlayerLight", value, "Invalid player light was set to map lighting"];
        }

        this._playerLights = value;
    }
    
    return this._playerLights;
};

/**
 * The player sight
 *
 * @param {Kuchulem_MapLighting_PlayerSight}
 * @returns {Kuchulem_MapLighting_PlayerSight}
 */
Kuchulem_MapLighting_Lighting.prototype.playerSight = function(value) {
    if (!!value) {
        if (!(value instanceof Kuchulem_MapLighting_PlayerSight)) {
            throw ["InvalidPlayerSight", value, "Invalid player sight was set to map lighting"];
        }

        this._playerSight = value;
    }
    
    return this._playerSight;
};

Kuchulem_MapLighting_Lighting.load = function(mapId) {
    return new Kuchulem_MapLighting_Lighting(
        mapId,
        $gameMapLighting.defaultLighting(), 
        $gameMapLighting.playerLights(),
        $gameMapLighting.defaultPlayerSight(),
        [], []
    )
};
//#endregion

(() => {
    //#region Game_Map extensions
    /**
     * Gets the map lighting configuration
     */
    Game_Map.prototype.lighting = function() {
        return $gameMapLighting.getMapLighting(this.mapId());
    };
    //#endregion

    //#region parameters and default lighting
    const pluginName = "Kuchulem_MapLighting";
    const parameters = PluginManager.parameters(pluginName);
    Kuchulem.createGameObject("$gameMapLighting", new Kuchulem_MapLighting(parameters), true)
    //#endregion

    //#region Events
    const createLightingSprite = function(spriteset) {
        spriteset._lights = new Sprite_Lights();
        spriteset.addChild(spriteset._lights);
    };

    $eventsPublisher.on(Spriteset_Base_events.beforeCreateUpperLayer, Spriteset_Base, createLightingSprite);
    //#endregion

    //#region commands
    /**
     * Sets a light source on an event current location
     * 
     * @param {object} light 
     */
    const setLightSource = function(args) {
        const light = JSON.parse(args.lightSource);
        const name = String(light.name);
        const shape = String(light.shape);
        const brightness = Number(light.brightness);
        const width = Number(light.width);
        const height = shape === "circle" ? width : Number(light.height);
        const highlightColor = Kuchulem_MapLighting_Color.fromJson(light.highlightColor);
        const event = $gameMap.event(this.eventId());
        const switchId = Number(light.switch);
        let existing = null;

        if (brightness > 0) {
            if (existing = $gameMap.lighting().lightSources().first(l => l.name() === name)) {
                $gameMap.lighting().lightSources().splice($gameMap.lighting().lightSources().indexOf(existing), 1);
            }
            $gameMap.lighting().lightSources().push(new Kuchulem_MapLighting_LightSource(
                `EV${ event.eventId() }_LightSource_${event.event().name}${!!name ? '_' : ''}${name}`,
                event,
                shape,
                width, height,
                new Kuchulem_MapLighting_Color(255, 255, 255, brightness),
                switchId
            ));
        }
        if (highlightColor.alpha() > 0) {
        
            if (existing = $gameMap.lighting().highlights().first(h => h.name() === name)) {
                $gameMap.lighting().highlights().splice($gameMap.lighting().highlights().indexOf(existing), 1);
            }

            $gameMap.lighting().highlights().push(new Kuchulem_MapLighting_LightSource(
                `EV${ event.eventId() }_Highlight_${ event.event().name }${ !!name ? '_' : '' }${ name }`,
                event,
                shape,
                width, height,
                highlightColor,
                switchId
            ));
        }
    };

    const setGlobalLighting = function(args) {
        const steps = JSON.parse(args.lightingSteps);
        const lightSteps = steps.map(s => {
            const step = JSON.parse(s);
            const time = JSON.parse(step.time);
            return new Kuchulem_MapLighting_LightStep(
                new Kuchulem_GameTime_Time(Number(time.hours), Number(time.minutes)),
                Kuchulem_MapLighting_Color.fromJson(step.color),
            )
        });

        $gameMap.lighting().global(lightSteps);
    };

    const setPlayerSight = function(args) {
        $gameMap.lighting().playerSight(new Kuchulem_MapLighting_PlayerSight(
            Number(args.radius),
            Number(args.brightness)
        ));
    };

    PluginManager.registerCommand(pluginName, "setLightSource", setLightSource);
    PluginManager.registerCommand(pluginName, "setPlayerSight", setPlayerSight);
    PluginManager.registerCommand(pluginName, "setGlobalLighting", setGlobalLighting);
    //#endregion
})();