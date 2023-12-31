if (!Kuchulem) {
    throw new Error("Kuchulem_Npcs requires Kuchulem_Base plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Manages NPCs and affects them to events in maps.
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * @base Kuchulem_Messages
 * @base Kuchulem_Events
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
 * @desc Associates an NPC with an event. This event behaviour will slightly
 *       change.
 *       An event with an NPC attached will have an appearence defined
 *       from the npc's characterName and characterIndex properties for all
 *       event pages except the first one, witch will remain as defined in the
 *       editor. Every other behaviours will stay the same.
 *       Other plugins may rely on that association when using commands in 
 *       an event associated to an NPC.
 * 
 * @arg npcId
 * @text NPC ID
 * @min 1
 * @type number
 * @desc The ID if the NPC for this event
 * 
 * @arg eventId
 * @text Event ID
 * @type event
 * @desc The event attached to this NPC
 * 
 * @command defineNpc
 * @text Define NPC
 * @desc Associates an NPC with the current event. This event behaviour will
 *       slightly change.
 *       An event with an NPC attached will have an appearence defined
 *       from the npc's characterName and characterIndex properties for all
 *       event pages except the first one, witch will remain as defined in the
 *       editor. Every other behaviours will stay the same.
 *       Other plugins may rely on that association when using commands in 
 *       an event associated to an NPC.
 * 
 * @command undefineNpc
 * @text Undefine NPC
 * @desc Removes the association between the current event and its NPC.
 * 
 * @command undefineNpcEvent
 * @text Unefine Npc Event
 * @desc Removes the association between the selected event and its NPC.
 * 
 * @arg eventId
 * @text Event ID
 * @type event
 * @desc The event attached to be undefined.
 * 
 * @arg npcId
 * @text NPC ID
 * @type number
 * @min 1
 * @desc The ID if the NPC for this event
 * 
 * @command changeNpcAppearence
 * @text Change NPC appearence
 * @desc Changes the selected NPC's appearence. His new appearence will remain
 *       as long as it is not changed again. When a game is saved, the NPCs
 *       whose appearence changed will keep the change.
 * 
 * @arg npcId
 * @text NPC ID
 * @type number
 * @min 1
 * @desc The ID if the NPC for this event
 * 
 * @arg characterName
 * @text Character sprite name
 * @type string
 * @desc The name of the character sprite to use.
 * 
 * @arg characterIndex
 * @text Character Index (index in sprite)
 * @type number
 * @min 0
 * @max 7
 * @desc The character index in the sprite, from 0 to 7. 
 * 
 * @arg faceName
 * @text Face sprite name
 * @type string
 * @desc The name of the face sprite to use.
 * 
 * @arg faceIndex
 * @text Face Index (index in sprite)
 * @type number
 * @min 0
 * @max 7
 * @desc The Face index in the sprite, from 0 to 7. 
 */

//#region Kuchulem_Npcs_Npc prototype definition 
/**
 * Defines an NPC
 * 
 * @class
 * @constructor
 */
function Kuchulem_Npcs_Npc() {
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
Kuchulem_Npcs_Npc.prototype.initialize = function(
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
};

/**
 * The npc ID
 *
 * @readonly
 * @type {number}
 * @name Kuchulem_Npcs_Npc#id
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "id", {
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
 * @name Kuchulem_Npcs_Npc#firstName
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "firstName", {
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
 * @name Kuchulem_Npcs_Npc#lastName
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "lastName", {
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
 * @name Kuchulem_Npcs_Npc#characterName
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "characterName", {
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
 * @name Kuchulem_Npcs_Npc#characterIndex
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "characterIndex", {
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
 * @name Kuchulem_Npcs_Npc#faceName
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "faceName", {
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
 * @name Kuchulem_Npcs_Npc#faceIndex
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "faceIndex", {
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
 * @name Kuchulem_Npcs_Npc#caracteristics
 */
Object.defineProperty(Kuchulem_Npcs_Npc.prototype, "caracteristics", {
    get: function() {
        return this._caracteristics;
    },
    configurable: true
});
//#endregion

//#region Kuchulem_Npcs_GameNpcs prototype definition
/**
 * Manages the NPC list of the game
 * 
 * @class
 * @constructor
 */
function Kuchulem_Npcs_GameNpcs() {
    this.initialize(...arguments);
};

/**
 * Initialises the NPC list
 */
Kuchulem_Npcs_GameNpcs.prototype.initialize = function() {
    this._npcs = [];
    this._npcEvents = [];
};

/**
 * Sets the NPC list from the NPC database file
 */
Kuchulem_Npcs_GameNpcs.prototype.setupForNewGame = function() {
    this.initialize();
};

Kuchulem_Npcs_GameNpcs.prototype._tryLoadNpcs = function() {
    if (!this._npcs.any()) {
        $dataNpcs.forEach(npc => {
            this._npcs.push(new Kuchulem_Npcs_Npc(
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
};

/**
 * Gets an NPC by its ID.
 * Returns null if no NPC is found
 * 
 * @param {number} npcId 
 * @returns 
 */
Kuchulem_Npcs_GameNpcs.prototype.npc = function(npcId) {
    this._tryLoadNpcs();

    return this._npcs.first(npc => npc.id === npcId);
};

/**
 * Gets an NPC by its ID.
 * Returns null if no NPC is found
 * 
 * @param {number} npcId 
 * @returns 
 */
Kuchulem_Npcs_GameNpcs.prototype.npcEvent = function(eventId) {
    this._tryLoadNpcs();

    const npcEvent = this._npcEvents.first(ne => ne[1] === $gameMap.mapId() && ne[2] === eventId);

    if (!!npcEvent) {
        return this.npc(npcEvent[0]);
    }
};

/**
 * Associates a game event to an npc.
 * 
 * @param {object} args 
 */
Kuchulem_Npcs_GameNpcs.prototype.setNpcEvent = function(npcId, mapId, eventId) {
    const npcEvent = [npcId, mapId, eventId];
    this.unsetNpcEvent(mapId, eventId);

    this._npcEvents.push(npcEvent);
};

/**
 * Associates a game event to an npc.
 * 
 * @param {object} args 
 */
Kuchulem_Npcs_GameNpcs.prototype.unsetNpcEvent = function(mapId, eventId) {
    const index = this._npcEvents.indexOf(this._npcEvents.first(ne => ne[1] === mapId && ne[2] === eventId))
    if (index > -1) {
        this._npcEvents.splice(index, 1);
    }
};
//#endregion

(() => {
    const pluginName = "Kuchulem_Npcs";

    //#region Event overloading
    const Game_Event_setupPageSettings_base = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        Game_Event_setupPageSettings_base.call(this, ...arguments);
        const npc = this.npc();
        if (this._pageIndex > 0 && npc) {
            this.setImage(npc.characterName, npc.characterIndex);
        }
    };

    /**
     * Gets the NPC associated to that event if any, null otherwise.
     * 
     * @returns {Kuchulem_Npcs_Npc}
     */
    Game_Event.prototype.npc = function() {
        return $gameNpcs.npcEvent(this.eventId());
    };
    //#endregion

    //#region $messageParsers register
    function Kuchulem_Npc_MessageParser() {
        this._regExp = /Npc\{(\w+)\}\[(\d+)\]/;
    }

    Kuchulem_Npc_MessageParser.prototype = Object.create(Kuchulem_Messages_Parser_Base.prototype);
    Kuchulem_Npc_MessageParser.prototype.constructor = Kuchulem_Npc_MessageParser;

    Kuchulem_Npc_MessageParser.prototype.matches = function(controlString) {
        if (!this._regExp.test(controlString)) {
            return null;
        }

        const matches = this._regExp.exec(controlString);

        return new Kuchulem_Messages_Parser_Match(this, { info: matches[1], npcId: Number(matches[2])});
    }

    Kuchulem_Npc_MessageParser.prototype.callback = function() {
        return function(interpreter, parameter) {
            const npc = $gameNpcs.npc(parameter.npcId);
            switch(parameter.info) {
                case "firstName":
                    return npc.firstName;
                case "lastName":
                    return npc.lastName;
                case "fullName":
                    return `\\Npc{firstName}[${npc.id}] \\Npc{lastName}[${npc.id}]`
                case "FIRSTNAME":
                    return npc.firstName.toLocaleUpperCase();
                case "LASTNAME":
                    return npc.lastName.toLocaleUpperCase();
                case "FULLNAME":
                    return `\\Npc{FIRSTNAME}[${npc.id}] \\Npc{LASTNAME}[${npc.id}]`
            }
        };
    }

    $messageParsers.registerParser(new Kuchulem_Npc_MessageParser());
    //#endregion

    //#region data file and game object registration
    const parameters = PluginManager.parameters(pluginName);

    const dataFile = String(parameters.dataFile);
    Kuchulem.registerDatabaseFile("$dataNpcs", dataFile ?? "Npcs.json");
    Kuchulem.createGameObject("$gameNpcs", new Kuchulem_Npcs_GameNpcs(), true);
    //#endregion
    //#region commands

    const defineNpcEvent = function(args) {
        const eventId = Number(args.eventId);
        const npcId = Number(args.npcId);
        $gameNpcs.setNpcEvent(npcId, $gameMap.mapId(), eventId);
    }

    const defineNpc = function(args) {
        defineNpcEvent.call(this, {
            npcId: Number(args.npcId),
            eventId: this.eventId()
        });
    }

    const undefineNpcEvent = function(args) {
        const eventId = Number(args.eventId);
        $gameNpcs.unsetNpcEvent($gameMap.mapId(), eventId);
    }

    const undefineNpc = function(args) {
        undefineNpcEvent.call(this, {
            eventId: this.eventId()
        });
    }

    const changeNpcAppearence = function(args) {
        const npcId = Number(args.npcId);
        const characterName = String(args.characterName);
        const characterIndex = Number(args.characterIndex);
        const faceName = String(args.faceName);
        const faceIndex = Number(args.faceIndex);
        const npc = $gameNpcs.npc(npcId);
        npc.characterName = characterName ?? npc.characterName;
        npc.characterIndex = characterIndex ?? npc.characterIndex;
        npc.faceName = faceName ?? npc.faceName;
        npc.faceIndex = faceIndex ?? npc.faceIndex;
    };

    PluginManager.registerCommand(pluginName, "defineNpcEvent", defineNpcEvent);
    PluginManager.registerCommand(pluginName, "defineNpc", defineNpc);
    PluginManager.registerCommand(pluginName, "undefineNpcEvent", undefineNpcEvent);
    PluginManager.registerCommand(pluginName, "undefineNpc", undefineNpc);
    PluginManager.registerCommand(pluginName, "changeNpcAppearence", changeNpcAppearence);
    //#endregion
})();