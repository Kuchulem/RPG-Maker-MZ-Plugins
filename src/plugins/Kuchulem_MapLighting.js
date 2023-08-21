if (!Kuchulem) {
    throw new Error("Kuchulem_MapLighting requires Kuchulem plugin to be loaded first");
}

Kuchulem.MapLighting = {
    pluginName: "Kuchulem_MapLighting"
};

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
 */
(() => {
    const pluginName = Kuchulem.MapLighting.pluginName;

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
        this._playerLightPosition = {};
        this.createBitmap();
        this.update();
    };

    /**
     * Destroys the sprite
     * 
     * @param {*} options 
     */
    Sprite_Lights.prototype.destroy = function(options) {
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
        this._shouldUpdate = false;
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
        this.updatePlayerLightPosition($gameMap.lighting().playerLight());
    };

    Sprite_Lights.prototype.getFixedPosition = function(x, y, width, height, shouldDraw = true) {
        const fixedX = (x - $gameMap.displayX()) * 48;
        const fixedY = (y - $gameMap.displayY()) * 48;
        const fixedWidth = width * 48 + (fixedX < 0 ? fixedX : 0);
        const fixedHeight = height * 48 + (fixedY < 0 ? fixedY : 0);
        return {
            x: fixedX < 0 ? 0 : fixedX,
            y: fixedY < 0 ? 0 : fixedY,
            width: fixedWidth,
            height: fixedHeight,
            shouldDraw: shouldDraw && (fixedX + fixedWidth) > 0 && (fixedY + fixedHeight > 0)
        }
    }

    Sprite_Lights.prototype.updateAreaPosition = function(area) {
        this._areasPositions[area.id] = this.getFixedPosition(
            area.x, area.y, 
            area.width, area.height,
            !!$gameMap.lighting().area(area.name)
        );
    }

    Sprite_Lights.prototype.updateLightSourcePosition = function(lightSource) {
        this._lightSourcesPositions[lightSource.name] = this.getFixedPosition(
            lightSource.x, lightSource.y,
            lightSource.width, lightSource.height,
            lightSource.isOn
        );
    }

    Sprite_Lights.prototype.updateHighlightPosition = function(highlight) {
        this._highlightsPositions[highlight.name] = this.getFixedPosition(
            highlight.x, highlight.y,
            highlight.width, highlight.height,
            highlight.isOn
        );
    }

    Sprite_Lights.prototype.updatePlayerSightPosition = function(playerSight) {
        if (!playerSight) {
            this._playerSightPosition = {
                shouldDraw: false
            };
            return;
        }
        
        const fixedWidth = playerSight * 48;
        const fixedHeight = playerSight * 48;
        this._playerSightPosition = {
            x: parseInt($gamePlayer.screenX() - fixedWidth / 2),
            y: parseInt($gamePlayer.screenY() - 24 - fixedHeight / 2),
            width: fixedWidth,
            height: fixedHeight,
            shouldDraw: true
        }
    }

    Sprite_Lights.prototype.updatePlayerLightPosition = function(playerLight) {
        console.log(playerLight);
        if (!playerLight) {
            this._playerLightPosition = {
                shouldDraw: false
            };
            return;
        }
        
        const fixedWidth = playerLight.width * 48;
        const fixedHeight = playerLight.width * 48;
        this._playerLightPosition = {
            x: parseInt($gamePlayer.screenX() - fixedWidth / 2),
            y: parseInt($gamePlayer.screenY() - 24 - fixedHeight / 2),
            width: fixedWidth,
            height: fixedHeight,
            shouldDraw: playerLight.isOn
        }
    }

    /**
     * Updates the bitmap. Creates a default overlay and redraws parts of the overlay
     * for the different areas in the map
     */
    Sprite_Lights.prototype.updateBitmap = function() {
        this.bitmap.clear();
        this._globalColor = Kuchulem.MapLighting.getFrameColor($gameMap.lighting().global(), this._globalColor);
        if (this._globalColor) {
            this.bitmap.fillAll(this._globalColor.toRgba());
        }
        if ($gameMap.lighting().playerSight()) {
            this.drawPlayerSight();
        }
        // $gameMap.areas().forEach(a => {
        //     this.drawArea(a);
        // });
        $gameMap.lighting().lightSources().forEach(ls => {
            this.drawLightSource(ls);
        });
        $gameMap.lighting().highlights().forEach(ls => {
            this.drawHighlight(ls);
        });
        if ($gameMap.lighting().playerLight()) {
            this.drawPlayerLight();
        }
    };

    /**
     * Clears a map area place in the overlay and fills it with the lightmap of the
     * area
     * 
     * @param {Kuchulem.Areas.Area} area 
     * @returns 
     */
    Sprite_Lights.prototype.drawArea = function(area) {
        this._areaColors = this._areaColors ?? [];
        
        if (!this._areasPositions[area.id] || !this._areasPositions[area.id].shouldDraw) {
            return;
        }

        this._areaColors[area.name] = Kuchulem.MapLighting.getFrameColor(
            $gameMap.lighting().area(area.name),
            this._areaColors[area.name]
        );
        
        if(!this._areaColors[area.name]) {
            return;
        }

        this.bitmap.clearRect(
            this._areasPositions[area.id].x, this._areasPositions[area.id].y, 
            this._areasPositions[area.id].width, this._areasPositions[area.id].height
        );
        this.bitmap.fillRect(
            this._areasPositions[area.id].x, this._areasPositions[area.id].y, 
            this._areasPositions[area.id].width, this._areasPositions[area.id].height,
            this._areaColors[area.name].toRgba()
        );
    };

    /**
     * Draws a light source on the sprite
     * 
     * @param {Kuchulem.MapLighting.LightSource} lightSource 
     */
    Sprite_Lights.prototype.drawLightSource = function(lightSource) {

        const fixedPosition = this._lightSourcesPositions[lightSource.name];

        if (!fixedPosition.shouldDraw) {
            return;
        }

        this.drawLight(fixedPosition, lightSource.color, lightSource.shape);
    }

    /**
     * Draws a highlight on the sprite
     * 
     * @param {Kuchulem.MapLighting.Highligh} highlight 
     */
    Sprite_Lights.prototype.drawHighlight = function(highlight) {

        const fixedPosition = this._highlightsPositions[highlight.name];

        if (!fixedPosition.shouldDraw) {
            return;
        }

        this.drawLight(fixedPosition, highlight.color, highlight.shape, "hard-light");
    }

    Sprite_Lights.prototype.drawPlayerSight = function() {
        if (this._playerLightPosition.shouldDraw) {
            return;
        }
        
        const color = new Kuchulem.MapLighting.Color(0, 0, 0, .2);

        this.drawLight(this._playerSightPosition, color, "circle", "destination-out");
    }

    Sprite_Lights.prototype.drawPlayerLight = function() {
        if (!this._playerLightPosition.shouldDraw) {
            return;
        }
        
        const color = new Kuchulem.MapLighting.Color(0, 0, 0, .8);

        const light = $gameMap.lighting().playerLight();
        this.drawLight(this._playerLightPosition, color, "circle", "destination-out");
        this.drawLight(this._playerLightPosition, light.color, light.shape, "hard-light");
    }

    /**
     * Draws a light source on the sprite
     * 
     * @param {Kuchulem.MapLighting.LightSource} lightSource 
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
                const centerX = position.x + (position.width / 2);
                const centerY = position.y + position.width / 2;
                var area = $gameMap.areas().first(a => a.isInside(centerX / 48, centerY / 48));
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
                    centerX, centerY, position.width / 4, centerX, centerY, (position.width / 2) - 1);

                gradient.addColorStop(0, color.toRgba());
                gradient.addColorStop(1, color.toRgba(0));
                this.bitmap.context.fillStyle = gradient;
                this.bitmap.context.beginPath();
                this.bitmap.context.arc(centerX, centerY, position.width / 2, 0, Math.PI * 2);
                this.bitmap.context.fill();
                break;
            default:
                throw ["InvalidLight", lightSource.shape, "Invalid light shape"]
        }
        this.bitmap.context.globalCompositeOperation = previousOperation
        this.bitmap.context.restore();
    }

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
    }
    //#endregion

    //#region Kuchulem.MapLighting.Color class definition
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
    Kuchulem.MapLighting.Color = function(red = 0, green = 0, blue = 0, alpha = 0) {
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
    Kuchulem.MapLighting.Color.prototype.red = function() { return this._red; }

    /**
     * The amount of green in the color
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Color.prototype.green = function() { return this._green; }

    /**
     * The amount of blue in the color
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Color.prototype.blue = function() { return this._blue; }

    /**
     * The alpha channel in the color
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Color.prototype.alpha = function() { return this._alpha; }

    /**
     * Converts the color object to an array usable by $gameScreen.startTint
     * 
     * @returns {Array}
     */
    Kuchulem.MapLighting.Color.prototype.toArray = function() {
        return [this._red, this._green, this._blue, this._alpha];
    }

    /**
     * Converts the color object to a rgba color
     * 
     * @returns 
     */
    Kuchulem.MapLighting.Color.prototype.toRgba = function(forcedAlpha = null) {
        forcedAlpha = forcedAlpha === null ? this._alpha : forcedAlpha;
        return `rgba(${parseInt(this._red)}, ${parseInt(this._green)}, ${parseInt(this._blue)}, ${forcedAlpha})`;
    }

    /**
     * Converts the color object to a rgb color
     * 
     * @returns 
     */
    Kuchulem.MapLighting.Color.prototype.toRgb = function() {
        return `rgb(${parseInt(this._red)}, ${parseInt(this._green)}, ${parseInt(this._blue)})`;
    }

    /**
     * Parse JSON data to a Color object
     * 
     * @param {number[]} color 
     * @returns {Kuchulem.MapLighting.Color}
     */
    Kuchulem.MapLighting.Color.fromArray = function(color) {
        return new Kuchulem.MapLighting.Color(
            Number(color[0]), 
            Number(color[1]), 
            Number(color[2]), 
            Number(color[3])
        );
    }
    //#endregion 

    //#region Kuchulem.MapLighting.Tone class definition
    /**
     * Represents a tone, as a color modificator
     * 
     * @class
     * @constructor
     * @param {number} red 
     * @param {number} green 
     * @param {number} blue 
     * @param {number} alpha 
     */
    Kuchulem.MapLighting.Tone = function(red = 0, green = 0, blue = 0, alpha = 0) {
        if (
            red <= 255 && red >= -255 &&
            green <= 255 && green >= -255 &&
            blue <= 255 && blue >= -255 &&
            alpha <= 1 && alpha >= -1
        ) {
            this._red = red;
            this._green = green;
            this._blue = blue;
            this._alpha = alpha;
        } else {
            throw ["InvalidTone", this, `An invalid value for tone tone was provided : ${red}, ${green}, ${blue}, ${alpha}`];
        }
    }

    /**
     * The amount of red in the tone
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Tone.prototype.red = function() { return this._red; }

    /**
     * The amount of green in the tone
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Tone.prototype.green = function() { return this._green; }

    /**
     * The amount of blue in the tone
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Tone.prototype.blue = function() { return this._blue; }

    /**
     * The alpha channel in the tone
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.Tone.prototype.alpha = function() { return this._alpha; }

    /**
     * Converts the tone object to an array usable by $gameScreen.startTint
     * 
     * @returns {Array}
     */
    Kuchulem.MapLighting.Tone.prototype.toArray = function() {
        return [this._red, this._green, this._blue, this._alpha];
    }

    /**
     * Applies the tone to a color and returns the resulting color
     * 
     * @param {Kuchulem.MapLighting.Color} color
     * 
     * @return {Kuchulem.MapLighting.Color}
     */
    Kuchulem.MapLighting.Tone.prototype.applyTo = function(color) {
        if (!(color instanceof Kuchulem.MapLighting.Color)) {
            throw ["Not a color", color];
        }

        return new Kuchulem.MapLighting.Color(
            (backgroundColor.red() + this.red()).clamp(0, 255),
            (backgroundColor.green() + this.green()).clamp(0, 255),
            (backgroundColor.blue() + this.blue()).clamp(0, 255),
            (backgroundColor.alpha() + this.alpha()).clamp(0, 1),
        );
    }
    //#endregion

    //#region Kuchulem.MapLighting.LightSource class definition
    /**
     * Defines a light source
     * 
     * @class
     * @constructor
     */
    Kuchulem.MapLighting.LightSource = function() {
        this.initialize(...arguments);
    }

    /**
     * Initializes the light source
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {string} shape 
     * @param {number} width 
     * @param {number} height 
     * @param {Kuchulem.MapLighting.Color} color,
     * @param {number} switchId 
     */
    Kuchulem.MapLighting.LightSource.prototype.initialize = function(
        name,
        x, 
        y, 
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
        this._x = x;
        this._y = y;
        this._shape = shape;
        this._width = width;
        this._height = height;
        this._color = color;
        this._switchId = switchId;
    }

    /**
     * The light source name
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.LightSource#name
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "name", {
        get: function() {
            return this._name;
        },
        configurable: true
    });

    /**
     * The light source X coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.LightSource#x
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "x", {
        get: function() {
            return this._x;
        },
        configurable: true
    });

    /**
     * The light source Y coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.LightSource#y
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "y", {
        get: function() {
            return this._y;
        },
        configurable: true
    });

    /**
     * The light source shape
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.LightSource#shape
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "shape", {
        get: function() {
            return this._shape;
        },
        configurable: true
    });

    /**
     * The light source width
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.LightSource#width
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "width", {
        get: function() {
            return this._width;
        },
        configurable: true
    });

    /**
     * The light source height
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.LightSource#height
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "height", {
        get: function() {
            return this._height;
        },
        configurable: true
    });

    /**
     * The light source color
     *
     * @readonly
     * @type {Kuchulem.MapLighting.Color}
     * @name Kuchulem.MapLighting.LightSource#color
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "color", {
        get: function() {
            return this._color;
        },
        configurable: true
    });

    /**
     * Wether the light source is ON (lighted) or OFF (unlighted)
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.LightSource#isOn
     */
    Object.defineProperty(Kuchulem.MapLighting.LightSource.prototype, "isOn", {
        get: function() {
            return !this._switchId || $gameSwitches.value(this._switchId);
        },
        configurable: true
    });
    //#endregion

    //#region Kuchulem.MapLighting.Hightlight class definition
    /**
     * Defines a highlight in the map. A highligth is an area where the light tone
     * is slightly changed. ie: light reflected on the ground from a window
     * 
     * @deprecated
     * 
     * @class
     * @constructor
     */
    Kuchulem.MapLighting.Hightlight = function() {
        this.initialize(...arguments);
    }

    /**
     * Initializes the highlight
     * 
     * @param {string} name
     * @param {number} x 
     * @param {number} y 
     * @param {string} shape 
     * @param {number} width 
     * @param {number} height 
     * @param {Kuchulem.MapLighting.Color} tone,
     * @param {number} switchId 
     */
    Kuchulem.MapLighting.Hightlight.prototype.initialize = function(
        name,
        x, 
        y, 
        shape, 
        width,
        height,
        tone,
        switchId
    ) {
        if (!["rectangle", "circle"].includes(shape)) {
            throw ["InvalidShape", shape, "Invalid shape provided"];        
        }
        this._name = name;
        this._x = x;
        this._y = y;
        this._shape = shape;
        this._width = width;
        this._height = height;
        this._tone = tone;
        this._switchId = switchId;
    }

    /**
     * The highlight name
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.Hightlight#name
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "name", {
        get: function() {
            return this._name;
        },
        configurable: true
    });

    /**
     * The highlight X coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.Hightlight#x
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "x", {
        get: function() {
            return this._x;
        },
        configurable: true
    });

    /**
     * The highlight Y coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.Hightlight#y
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "y", {
        get: function() {
            return this._y;
        },
        configurable: true
    });

    /**
     * The highlight shape
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.Hightlight#shape
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "shape", {
        get: function() {
            return this._shape;
        },
        configurable: true
    });

    /**
     * The highlight width
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.Hightlight#width
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "width", {
        get: function() {
            return this._width;
        },
        configurable: true
    });

    /**
     * The highlight height
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.MapLighting.Hightlight#height
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "height", {
        get: function() {
            return this._height;
        },
        configurable: true
    });

    /**
     * The highlight color
     *
     * @readonly
     * @type {Kuchulem.MapLighting.Tone}
     * @name Kuchulem.MapLighting.Hightlight#tone
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "tone", {
        get: function() {
            return this._tone;
        },
        configurable: true
    });

    /**
     * Wether the highlight is ON (lighted) or OFF (unlighted)
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.MapLighting.Hightlight#isOn
     */
    Object.defineProperty(Kuchulem.MapLighting.Hightlight.prototype, "isOn", {
        get: function() {
            return !this._switchId || $gameSwitches.value(this._switchId);
        },
        configurable: true
    });
    //#endregion

    //#region Kuchulem.MapLighting.LightStep class definition
    /**
     * Defines a light step. A light step is specific time of in-game time with
     * a specific lighting. The lighting will gradually evolve from one step to
     * another.
     * 
     * @param {Kuchulem.GameTime.Time} time 
     * @param {Kuchulem.MapLighting.Color} color 
     */
    Kuchulem.MapLighting.LightStep = function(time, color) {
        if (
            time instanceof Kuchulem.GameTime.Time &&
            color instanceof Kuchulem.MapLighting.Color
        ) {
            this._time = time;
            this._color = color;
        } else {
            throw ["InvalidLightStep", this, "Time or color provided is invalid"]
        }
    }

    /**
     * Gets the time for that step
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.LightStep.prototype.time = function() { return this._time; }

    /**
     * Gets the color for that step
     * 
     * @returns {number}
     */
    Kuchulem.MapLighting.LightStep.prototype.color = function() { return this._color; }
    //#endregion

    //#region Kuchulem.MapLighting.Lighting prototype definition
    Kuchulem.MapLighting.Lighting = function() {
        this.initialize(...arguments);
    }

    Kuchulem.MapLighting.Lighting.prototype.initialize = function(globalLighting, areasLighting, playerLight, playerSight, lightSources, highlights) {
        this._globalLighting = globalLighting ?? [];
        this._areasLighting = areasLighting ?? {};
        this._lightSources = lightSources ?? [];
        this._highlights = highlights ?? [];
        this._playerLight = playerLight ?? null;
        this._playerSight = playerSight ?? null;
    }

    Kuchulem.MapLighting.Lighting.prototype.global = function() { return this._globalLighting; };

    Kuchulem.MapLighting.Lighting.prototype.area = function(areaName) {
        return this._areasLighting[areaName] ?? [];
    }

    Kuchulem.MapLighting.Lighting.prototype.lightSources = function() { return this._lightSources; };

    Kuchulem.MapLighting.Lighting.prototype.highlights = function() { return this._highlights; };
    Kuchulem.MapLighting.Lighting.prototype.playerLight = function() { return this._playerLight; };
    Kuchulem.MapLighting.Lighting.prototype.playerSight = function() { return this._playerSight; };

    Kuchulem.MapLighting.Lighting.load = function(mapId) {
        const mapLightingConfig = $dataMapsLighting.first(ml => ml.mapId === mapId);
        if (!mapLightingConfig) {
            return new Kuchulem.MapLighting.Lighting();
        }

        const global = (mapLightingConfig.global ?? []).map(l => 
            new Kuchulem.MapLighting.LightStep(
                Kuchulem.GameTime.Time.fromArray(l.time),
                Kuchulem.MapLighting.Color.fromArray(l.color),
            )
        );

        const areas = {};

        (mapLightingConfig.areas ?? []).forEach(al => areas[al.areaName] = al.steps.map(l => 
            new Kuchulem.MapLighting.LightStep(
                Kuchulem.GameTime.Time.fromArray(l.time),
                Kuchulem.MapLighting.Color.fromArray(l.color),
            )
        ));

        const lightSources = (mapLightingConfig.lightSources ?? []).map(ls => 
            new Kuchulem.MapLighting.LightSource(
                ls.name,
                ls.x,
                ls.y,
                ls.shape,
                ls.width,
                ls.height,
                Kuchulem.MapLighting.Color.fromArray(ls.color),
                ls.switch
            )
        );

        const highlights = (mapLightingConfig.highlights ?? []).map(hl =>
            new Kuchulem.MapLighting.LightSource(
                hl.name,
                hl.x,
                hl.y,
                hl.shape,
                hl.width,
                hl.height,
                Kuchulem.MapLighting.Color.fromArray(hl.color),
                hl.switch
            )
        );

        const playerLight = new Kuchulem.MapLighting.LightSource(
            "player",
            0, 0,
            mapLightingConfig.playerLight.shape,
            mapLightingConfig.playerLight.width, mapLightingConfig.playerLight.height,
            Kuchulem.MapLighting.Color.fromArray(mapLightingConfig.playerLight.color),
            mapLightingConfig.playerLight.switch
        );

        const playerSight = mapLightingConfig.playerSight;

        return new Kuchulem.MapLighting.Lighting(
            global, areas, playerLight, playerSight, lightSources, highlights
        )
    }
    //#endregion

    //#region static methods
    /**
     * Calculates the color for the provided time
     * 
     * @param {Kuchulem.GameTime.Time} time 
     * @param {Kuchulem.MapLighting.LightStep} previousStep 
     * @param {Kuchulem.MapLighting.LightStep} nextStep 
     * @returns {Kuchulem.MapLighting.Color}
     */
    Kuchulem.MapLighting.calculateFrameColorChange = function(previousStep, nextStep) {
        const nbFrames = (nextStep.time().toMinutes() - previousStep.time().toMinutes()) * $gameClock.framesPerMinute();

        return [
            parseFloat((nextStep.color().red() - previousStep.color().red()) / nbFrames),
            parseFloat((nextStep.color().green() - previousStep.color().green()) / nbFrames),
            parseFloat((nextStep.color().blue() - previousStep.color().blue()) / nbFrames),
            parseFloat((nextStep.color().alpha() - previousStep.color().alpha()) / nbFrames),
        ];
    }

    /**
     * Computes the color for the actual frame
     * 
     * @param {Kuchulem.MapLighting.LightStep[]} steps 
     * @param {Kuchulem.MapLighting.Color} previousColor 
     * 
     * @return {Kuchulem.MapLighting.Color}
     */
    Kuchulem.MapLighting.getFrameColor = function(steps, previousColor) {
        const time = $gameClock.realTime();
        const sortedSteps = steps.sort((a, b) => a.time().toMinutes() - b.time().toMinutes());

        if (!sortedSteps.any()) {
            return;
        }

        let currentStep = sortedSteps.first(s => s.time().toMinutes() === time.toMinutes());

        if (currentStep) {
            return currentStep.color();    
        }

        const previousStep = Kuchulem.MapLighting.getPreviousStep(time, sortedSteps);
        const nextStep = Kuchulem.MapLighting.getNextStep(time, sortedSteps);
        if (!previousColor) {
            previousColor = previousStep.color();
        }
        var change = Kuchulem.MapLighting.calculateFrameColorChange(previousStep, nextStep);

        return new Kuchulem.MapLighting.Color(
            (previousColor.red() + change[0]).clamp(0, 255),
            (previousColor.green() + change[1]).clamp(0, 255),
            (previousColor.blue() + change[2]).clamp(0, 255),
            (previousColor.alpha() + change[3]).clamp(0, 1),
        );
    }

    /**
     * Gets the previous light step from a list of steps
     * 
     * @param {Kuchulem.GameTime.Time} time 
     * @param {Kuchulem.MapLighting.LightStep[]} sortedSteps The light steps of the area, sorted by time
     * @returns {Kuchulem.MapLighting.LightStep}
     */
    Kuchulem.MapLighting.getPreviousStep = function(time, sortedSteps) {
        const lastStep = sortedSteps.last();
        return sortedSteps.last(s => s.time().toMinutes() <= time.toMinutes()) ??
            new Kuchulem.MapLighting.LightStep(
                new Kuchulem.GameTime.Time(
                    lastStep.time().hours() - 24, lastStep.time().minutes()), 
                    lastStep.color()
            );
    }

    /**
     * Gets the next light step from a list of steps
     * 
     * @param {Kuchulem.GameTime.Time} time The current in-game time
     * @param {Kuchulem.MapLighting.LightStep[]} sortedSteps The light steps of the area, sorted by time
     * @returns {Kuchulem.MapLighting.LightStep}
     */
    Kuchulem.MapLighting.getNextStep = function(time, sortedSteps) {
        const firstStep = sortedSteps.first();
        return sortedSteps.first(s => s.time().toMinutes() > time.toMinutes()) ??
            new Kuchulem.MapLighting.LightStep(
                new Kuchulem.GameTime.Time(
                    firstStep.time().hours() + 24, firstStep.time().minutes()), 
                firstStep.color()
            );
    }
    //#endregion

    //#region Game_Map extensions
    /**
     * Gets the map lighting configuration
     */
    Game_Map.prototype.lighting = function() {
        return this._lighting;
    }
    //#endregion

    //#region data file
    Kuchulem.registerDatabaseFile("$dataMapsLighting", "MapsLighting.json");
    //#endregion

    //#region Events
    const loadMapsLighting = function(map) {
        map._lighting = Kuchulem.MapLighting.Lighting.load(map.mapId());
    }

    const createLightingSprite = function(spriteset) {
        spriteset._lights = new Sprite_Lights();
        spriteset.addChild(spriteset._lights);
    }
    
    $eventsPublisher.on(Spriteset_Base.events.beforeCreateUpperLayer, Spriteset_Base, s => {
        createLightingSprite(s);
    });

    $eventsPublisher.on(Game_Map.events.afterSetup, Game_Map, loadMapsLighting);
    //#endregion
})();