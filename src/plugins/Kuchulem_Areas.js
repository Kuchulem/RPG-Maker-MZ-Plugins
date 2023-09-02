if (!Kuchulem) {
    throw new Error("Kuchulem_Areas requires Kuchulem plugin to be loaded first");
}

Kuchulem_Areas = {
    pluginName: "Kuchulem_Areas"
};

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
 * @param dataFile
 * @type string
 * @default Areas.json
 * @text Data file name
 * @desc The data file name that will define areas 
 */
(() => {
    const pluginName = Kuchulem_Areas.pluginName;

    //#region Kuchulem_Areas_Area class definition
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
    Kuchulem_Areas_Area = function(
        id, mapId,
        name,
        x, y, 
        width, height
    ) {
        this.initialize(id, mapId, name, x, y, width, height);
    }

    Kuchulem_Areas_Area.prototype.initialize = function(
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
     * @name Kuchulem_Areas_Area#x
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "x", {
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
     * @name Kuchulem_Areas_Area#y
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "y", {
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
     * @name Kuchulem_Areas_Area#height
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "height", {
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
     * @name Kuchulem_Areas_Area#id
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "id", {
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
     * @name Kuchulem_Areas_Area#mapId
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "mapId", {
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
     * @name Kuchulem_Areas_Area#name
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "name", {
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
     * @name Kuchulem_Areas_Area#width
     */
    Object.defineProperty(Kuchulem_Areas_Area.prototype, "width", {
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
    Kuchulem_Areas_Area.prototype.isPlayerInside = function() {
        return this.isInside($gamePlayer.x, $gamePlayer.y);
    }

    /**
     * Checks if coodinates are in the area
     * 
     * @returns {boolean}
     */
    Kuchulem_Areas_Area.prototype.isInside = function(x, y) {
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
     * @returns {Kuchulem_Areas_Area}
     */
    Game_Map.prototype.area = function(areaId) {
        return this._areas.first(areaId);
    }

    /**
     * Gets the areas sharing areaName
     * 
     * @param {string} areaName 
     * @returns {Kuchulem_Areas_Area[]}
     */
    Game_Map.prototype.namedAreas = function(areaName) {
        return this._areas.filter(a => a.name === areaName);
    }

    /**
     * Gets the areas sharing the same name in witch the palyer stands
     * 
     * @returns {Kuchulem_Areas_Area[]}
     */
    Game_Map.prototype.playerAreas = function() {
        return this._areas.filter(a =>
            a.name === this._areas.first(a => a.isPlayerInside())  
        );
    }

    /**
     * Gets the areas of the map
     * 
     * @returns {Kuchulem_Areas_Area[]}
     */
    Game_Map.prototype.areas = function() {
        return this._areas;
    }
    //#endregion

    //#region data file registration
    const parameters = PluginManager.parameters(pluginName);

    const dataFile = String(parameters.dataFile);
    Kuchulem.registerDatabaseFile("$dataAreas", dataFile ?? "Areas.json");
    //#endregion

    //#region Events
    const loadAreas = function(map) {
        if (!!map._areas && map._areas.any()) {
            return;
        }

        map._areas = [];
        $dataAreas.filter(a => a.mapId === map.mapId()).forEach(area => {
            map._areas.push(new Kuchulem_Areas_Area(
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
    //#endregion
})();