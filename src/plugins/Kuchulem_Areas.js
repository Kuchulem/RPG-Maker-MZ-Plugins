if (!Kuchulem) {
    throw new Error("Kuchulem_Areas requires Kuchulem plugin to be loaded first");
}

Kuchulem.Areas = {
    pluginName: "Kuchulem_Areas"
}

/*:
 * @target MZ
 * @plugindesc Manages map areas.
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * @base Kuchulem_Events
 *
 * @help Kuchulem_Areas.js
 *
 * This plugin allows to define areas in a JSON database object. Areas are
 * rectangular zones in a map.
 * Areas may be combined to create a complex "meta area".
 * Areas are used in several plugins.
 * 
 * # Areas can be retrieved from the $gameMap object :
 * 
 * 1. | {Kuchulem.Areas.Area} area = $gameMap.area({number} areaId);
 * 
 * This returns a single area with the areaId.
 * 
 * 1. | {Kuchulem.Areas.Area[]} areas = $gameMap.namedArea({string} areaName);
 * 
 * This returns the areas sharing the same name.
 * 
 * # Areas where the player is located can also be retrieved from the $gameMap
 * object :
 * 
 * 1. | {Kuchulem.Areas.Area[]} areas = $gameMap.playerAreas();
 * 
 * This returns the areas with the same name when player is located in one of
 * them.
 * 
 * # Map areas can be retrieved all together :
 * 
 * 1. | {Kuchulem.Areas.Area[]} areas = $gameMap.areas();
 */
(() => {
    const pluginName = Kuchulem.Areas.pluginName;

    //#region STRUCTS
    /*~struct~area:
    * 
    * @param id
    * @type number
    * @min 1
    * @text Area ID
    * @desc The ID of the area. MUST be unique for the map.
    * 
    * @param name
    * @type string
    * @text Area name
    * @desc The name of the area. If multiple areas share the same name in the map
    *       they will be considered the same area and when the player will enter
    *       any of them, all the areas sharing its name will be returned.
    * 
    * @param x
    * @type number
    * @text Area X coordinate
    * @desc The X coordinate (horizontal) of the top left corner of the area.
    *       The unit for the coordinates is the tile.
    *       The top left tile of the map has the [0, 0] coordinates. 
    * 
    * @param y
    * @type number
    * @text Area Y coordinate
    * @desc The Y coordinate (vertical) of the top left corner of the area.
    *       The unit for the coordinates is the tile.
    *       The top left tile of the map has the [0, 0] coordinates.
    * 
    * @param width
    * @type number
    * @text Area width
    * @desc The width of the area.
    *       The unit for the size is the tile.
    * 
    * @param height
    * @type number
    * @text Area height
    * @desc The height of the area.
    *       The unit for the size is the tile.
    */
    //#endregion

    //#region Kuchulem.Areas.Area class definition
    /**
     * Defines an area. An area is a rectangle shaped group of tiles in a map.
     * 
     * Each area in a same map MUST have a unique ID (id).
     * Howerver to define complexe areas the name can be shared accros multiple 
     * ones.
     * Two areas sharing the same name should be treated as a single one.
     * The unit for coordinates and size is the tile, the top-left tile has a coodinate
     * of [0,0]
     * 
     * @class
     * @constructor
     * 
     * @param {number} id The ID of the area 
     * @param {number} mapId The ID of the map in the area
     * @param {string} name The name of the area
     * @param {number} x The X coorinate of the area from the top left corner.  
     * @param {number} y The Y coorinate of the area from the top left corner.
     * @param {number} width The width in number of tiles of the area
     * @param {number} height The height in number of tiles of the area
     */
    Kuchulem.Areas.Area = function(
        id, mapId,
        name,
        x, y, 
        width, height
    ) {
        this.initialize(id, mapId, name, x, y, width, height);
    }

    Kuchulem.Areas.Area.prototype.initialize = function(
        id, mapId,
        name,
        x, y, 
        width, height
    ) {
        this._id = id;
        this._mapId = mapId || $gameMap.mapId();
        this._name = name;
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }

    /**
     * The area X coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#x
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "x", {
        get: function() {
            return this._x;
        },
        configurable: true
    });

    /**
     * The area Y coordinate
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#y
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "y", {
        get: function() {
            return this._y;
        },
        configurable: true
    });

    /**
     * The area height
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#height
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "height", {
        get: function() {
            return this._height;
        },
        configurable: true
    });

    /**
     * The area ID
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#id
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "id", {
        get: function() {
            return this._id;
        },
        configurable: true
    });

    /**
     * The area map ID
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#mapId
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "mapId", {
        get: function() {
            return this._mapId;
        },
        configurable: true
    });

    /**
     * The area name
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#name
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "name", {
        get: function() {
            return this._name;
        },
        configurable: true
    });

    /**
     * The area width
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Areas.Area#width
     */
    Object.defineProperty(Kuchulem.Areas.Area.prototype, "width", {
        get: function() {
            return this._width;
        },
        configurable: true
    });

    /**
     * Checks if player is in the area
     * 
     * @returns {boolean}
     */
    Kuchulem.Areas.Area.prototype.isPlayerInside = function() {
        return this.isInside($gamePlayer.x, $gamePlayer.y);
    }

    /**
     * Checks if coodinates are in the area
     * 
     * @returns {boolean}
     */
    Kuchulem.Areas.Area.prototype.isInside = function(x, y) {
        const displayX = this._x - $gameMap.displayX();
        const displayY = this._y - $gameMap.displayY();
        return (
            $gameMap.mapId() === this._mapId &&
            x >= displayX &&
            y >= displayY &&
            x < displayX + this._width &&
            y < displayY + this._height
        );
    }
    //#endregion

    //#region Game_Map extensions
    /**
     * Gets an area from the current map
     * 
     * @param {number} areaId 
     * @returns {Kuchulem.Areas.Area}
     */
    Game_Map.prototype.area = function(areaId) {
        return this._areas.first(areaId);
    }

    /**
     * Gets the areas sharing areaName
     * 
     * @param {string} areaName 
     * @returns {Kuchulem.Areas.Area[]}
     */
    Game_Map.prototype.namedAreas = function(areaName) {
        return this._areas.filter(a => a.name === areaName);
    }

    /**
     * Gets the areas sharing the same name in witch the palyer stands
     * 
     * @returns {Kuchulem.Areas.Area[]}
     */
    Game_Map.prototype.playerAreas = function() {
        return this._areas.filter(a =>
            a.name === this._areas.first(a => a.isPlayerInside())  
        );
    }

    /**
     * Gets the areas of the map
     * 
     * @returns {Kuchulem.Areas.Area[]}
     */
    Game_Map.prototype.areas = function() {
        return this._areas;
    }
    //#endregion

    Kuchulem.registerDatabaseFile("$dataAreas", "Areas.json");

    const loadAreas = function(map) {
        if (!!map._areas && map._areas.any()) {
            return;
        }

        map._areas = [];
        $dataAreas.filter(a => a.mapId === map.mapId()).forEach(area => {
            map._areas.push(new Kuchulem.Areas.Area(
                area.id,
                area.mapId,
                area.name,
                area.x,
                area.y,
                area.width,
                area.height
            ));
        });
    }

    $eventsPublisher.on(Game_Map.events.afterSetup, Game_Map, loadAreas);
})();