if (!Kuchulem) {
    throw new Error("Kuchulem_Npcs requires Kuchulem_Base plugin to be loaded first");
}

Kuchulem.Npcs = {
    pluginName: "Kuchulem_Npcs"
};


/*:
 * @target MZ
 * @plugindesc Manages NPCs and affects them to events in maps.
 * @author Kuchulem
 *
 * @help Kuchulem_Npcs.js
 *
 * Defines an object for NPCs, a manager to load NPCs data from json files and
 * commands to affect NPCs to events in the map.
 * 
 * An event with an NPC attached will have an appearence defined
 * from the npc's characterName and characterIndex properties for all
 * event pages except the first one, witch will remain as defined in the
 * editor. Every other behaviours will stay the same.
 * Other plugins may rely on that association when using commands in 
 * an event associated to an NPC.
 * 
 * @param dataFile
 * @type string
 * @default Npcs.json
 * @text Data file name
 * @desc The data file name that will define npcs 
 * 
 * @command defineNpcEvent
 * @text Define Npc Event
 * @desc Associates an NPC with an event. This event behaviour will swlightly
 *       change. An event with an NPC attached will have an appearence defined
 *       from the npc's characterName and characterIndex properties for all
 *       event pages except the first one, witch will remain as defined in the
 *       editor. Every other behaviours will stay the same.
 *       Other plugins may rely on that association when using commands in 
 *       an event associated to an NPC.
 * 
 * @arg npcId
 * @text NPC ID
 * @type number
 * @desc The ID if the NPC for this event
 * 
 * @arg eventId
 * @text Event ID
 * @type event
 * @desc The event attached to this NPC
 */
(() => {
    const pluginName = Kuchulem.Npcs.pluginName;

    /**
     * Defines an NPC
     * 
     * @class
     * @constructor
     */
    Kuchulem.Npcs.Npc = function() {
        this.initialize(...arguments);
    }

    /**
     * Initializes the NPC
     * 
     * @param {number} id 
     * @param {string} firstName 
     * @param {string} lastName 
     * @param {string} characterName
     * @param {number} characterIndex
     * @param {string} faceName
     * @param {number} faceIndex
     * @param {Object} caracteristics 
     */
    Kuchulem.Npcs.Npc.prototype.initialize = function(
        id,
        firstName,
        lastName,
        characterName,
        characterIndex,
        faceName,
        faceIndex,
        caracteristics
    ) {
        this._id = Number(id);
        this._firstName = String(firstName);
        this._lastName = String(lastName);
        this._characterName = String(characterName);
        this._characterIndex = Number(characterIndex);
        this._faceName = String(faceName);
        this._faceIndex = Number(faceIndex);
        this._caracteristics = caracteristics ?? {};
    }

    /**
     * The npc ID
     *
     * @readonly
     * @type {number}
     * @name Kuchulem.Npcs.Npc#id
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "id", {
        get: function() {
            return this._id;
        },
        configurable: true
    });

    /**
     * The npc first name
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#firstName
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "firstName", {
        get: function() {
            return this._firstName;
        },
        set: function(value) {
            if (typeof(value) === typeof("")) {
                this._firstName = value;
            }
        },
        configurable: true
    });

    /**
     * The npc last name
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#lastName
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "lastName", {
        get: function() {
            return this._lastName;
        },
        set: function(value) {
            if (typeof(value) === typeof("")) {
                this._lastName = value;
            }
        },
        configurable: true
    });

    /**
     * The name of the characters sprite to be used for this NPC
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#characterName
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "characterName", {
        get: function() {
            return this._characterName;
        },
        set: function(value) {
            if (typeof(value) === typeof("")) {
                this._characterName = value;
            }
        },
        configurable: true
    });

    /**
     * The index in the characters sprite to be used for this NPC
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#characterIndex
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "characterIndex", {
        get: function() {
            return this._characterIndex;
        },
        set: function(value) {
            if (typeof(value) === typeof(0)) {
                this._characterIndex = value;
            }
        },
        configurable: true
    });

    /**
     * The name of the sprite for this npc's face
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#faceName
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "faceName", {
        get: function() {
            return this._faceName;
        },
        set: function(value) {
            if (typeof(value) === typeof("")) {
                this._faceName = value;
            }
        },
        configurable: true
    });

    /**
     * The index if the sprite for this npc's face
     *
     * @readonly
     * @type {string}
     * @name Kuchulem.Npcs.Npc#faceIndex
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "faceIndex", {
        get: function() {
            return this._faceIndex;
        },
        set: function(value) {
            if (typeof(value) === typeof(0)) {
                this._faceIndex = value;
            }
        },
        configurable: true
    });

    /**
     * The npc caracteristics
     *
     * @readonly
     * @type {Object}
     * @name Kuchulem.Npcs.Npc#caracteristics
     */
    Object.defineProperty(Kuchulem.Npcs.Npc.prototype, "caracteristics", {
        get: function() {
            return this._caracteristics;
        },
        configurable: true
    });

    /**
     * Manages the NPC list of the game
     * 
     * @class
     * @constructor
     */
    Kuchulem.Npcs.GameNpcs = function() {
        this.initialize(...arguments);
    }

    /**
     * Initialises the NPC list
     */
    Kuchulem.Npcs.GameNpcs.prototype.initialize = function() {
        this._npcs = [];
    }

    /**
     * Sets the NPC list from the NPC database file
     */
    Kuchulem.Npcs.GameNpcs.prototype.setupForNewGame = function() {
        this.initialize();
    }

    Kuchulem.Npcs.GameNpcs.prototype._tryLoadNpcs = function() {
        if (!this._npcs.any()) {
            $dataNpcs.forEach(npc => {
                this._npcs.push(new Kuchulem.Npcs.Npc(
                    npc.id,
                    npc.firstName,
                    npc.lastName,
                    npc.characterName,
                    npc.characterIndex,
                    npc.faceName,
                    npc.faceIndex,
                    npc.caracteristics
                ));
            });

            return true;
        }

        return false;
    }

    /**
     * Gets an NPC by its ID.
     * Returns null if no NPC is found
     * 
     * @param {number} npcId 
     * @returns 
     */
    Kuchulem.Npcs.GameNpcs.prototype.npc = function(npcId) {
        this._tryLoadNpcs();

        return this._npcs.first(npc => npc.id === npcId);
    }

    /**
     * Associates a game event to an npc.
     * 
     * @param {object} args 
     */
    Kuchulem.Npcs.GameNpcs.defineNpcEvent = function(args) {
        const eventId = Number(args.eventId);
        const npcId = Number(args.npcId);
        const event = $gameMap.event(eventId);
        event._npc = $gameNpcs.npc(npcId);
    } 

    //#region Event overloading
    const Game_Event_setupPageSettings_base = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        Game_Event_setupPageSettings_base.call(this, ...arguments);
        if (this._pageIndex > 0 && this._npc) {
            this.setImage(this._npc.characterName, this._npc.characterIndex);
        }
    }

    /**
     * Gets the NPC associated to that event, if any, null otherwise.
     * 
     * @returns {Kuchulem.Npcs.Npc}
     */
    Game_Event.prototype.npc = function() {
        return this._npc ?? null;
    }
    //#region 

    //#region data file and game object registration
    const parameters = PluginManager.parameters(pluginName);

    const dataFile = String(parameters.dataFile);
    Kuchulem.registerDatabaseFile("$dataNpcs", dataFile ?? "Npcs.json");
    Kuchulem.createGameObject("$gameNpcs", new Kuchulem.Npcs.GameNpcs());
    //#endregion

    PluginManager.registerCommand(pluginName, "defineNpcEvent", Kuchulem.Npcs.GameNpcs.defineNpcEvent);
})();