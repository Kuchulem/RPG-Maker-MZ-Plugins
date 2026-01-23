if (!Kuchulem) {
    throw new Error("Kuchulem_Events requires Kuchulem plugin to be loaded first");
}

/*:
 * @target MZ
 * @plugindesc Adds and events publisher on specific methods of RMMZ core classes.
 * @author Kuchulem
 * 
 * @base Kuchulem_Base
 * @base Kuchulem_ArrayExtensions
 * 
 * @help Kuchulem_Events.js
 * 
 * Triggers events on various core classes calls, like update or refresh of the
 * spriteset or the map.
 * 
 * Methods can register those events and be called when the event is
 * dispatched.
 * 
 * Usage : 
 * 
 * ----------------------------------------------------------------------------
 *  1. | $eventsPublisher.on(
 *  2. |     "afterRefresh", // callback will be called after refresh...
 *  3. |     Game_Map,       // ... of a Game_Map instance
 *  4. |     () => {
 *  5. |         // your code when map is refreshed
 *  6. |     }
 *  7. | );
 * ----------------------------------------------------------------------------
 */
//#region Kuchulem_Events_Subscribtion class definition
/**
 * Represents a subscribtion
 * 
 * @class
 * @constructor
 * @param {string} eventName 
 * @param {Object} publisher
 * @param {string} type 
 * @param {Function} callback 
 */
function Kuchulem_Events_Subscribtion() {
    this.initialize(...arguments);
}

/**
 * Initializes the subscribtion
 * 
 * @param {string} eventName 
 * @param {*} publisher 
 * @param {string} type 
 * @param {Function} callback 
 * @param {any} thisArg
 */
Kuchulem_Events_Subscribtion.prototype.initialize = function(eventName, publisher, type, callback, thisArg) {
    this._eventName = eventName;
    this._publisher = publisher;
    this._type = ["global", "switch", "variable"].includes(type) ? type : "global";
    this._callback = callback;
    this._thisArg = thisArg;
};

/**
 * The event name registered
 *
 * @readonly
 * @type string
 * @name Kuchulem_Events_Subscribtion#eventName
 */
Object.defineProperty(Kuchulem_Events_Subscribtion.prototype, "eventName", {
    get: function() {
        return this._eventName;
    },
    configurable: true
});

/**
 * The class of the object publishing the event registered
 *
 * @readonly
 * @type Object
 * @name Kuchulem_Events_Subscribtion#publisher
 */
Object.defineProperty(Kuchulem_Events_Subscribtion.prototype, "publisher", {
    get: function() {
        return this._publisher;
    },
    configurable: true
});

/**
 * The callback to be called when event is triggered
 *
 * @readonly
 * @type Function
 * @name Kuchulem_Events_Subscribtion#callback
 */
Object.defineProperty(Kuchulem_Events_Subscribtion.prototype, "callback", {
    get: function() {
        return this._callback;
    },
    configurable: true
});

/**
 * The type of publisher
 *
 * @readonly
 * @type Function
 * @name Kuchulem_Events_Subscribtion#type
 */
Object.defineProperty(Kuchulem_Events_Subscribtion.prototype, "type", {
    get: function() {
        return this._type
    },
    configurable: true
});

/**
 * The thisArg of publisher
 *
 * @readonly
 * @type any
 * @name Kuchulem_Events_Subscribtion#thisArg
 */
Object.defineProperty(Kuchulem_Events_Subscribtion.prototype, "thisArg", {
    get: function() {
        return this._thisArg
    },
    configurable: true
});
//#endregion	

//#region Kuchulem_Events_Publisher class definition
/**
 * The class that will manage the events
 * 
 * @class
 */
function Kuchulem_Events_Publisher() {
    this._subscribtions = {
        global: [],
        switches: [],
        variables: []
    };
}

/**
 * Registers a callback for an event
 * 
 * @param {string} eventName 
 * @param {Object} publisher 
 * @param {Function} callback 
 */
Kuchulem_Events_Publisher.prototype.on = function(eventName, publisher, callback, thisArg) {
    this._subscribtions.global.push(
        new Kuchulem_Events_Subscribtion(eventName, publisher, "global", callback, thisArg)
    );
};

/**
 * Unregisters a callback for an event
 * 
 * @param {string} eventName 
 * @param {Object} publisherClass 
 * @param {Function} callback 
 */
Kuchulem_Events_Publisher.prototype.off = function(eventName, publisher, callback) {
    const toRemove = this._subscribtions.global.filter(s =>
        s.eventName === eventName 
        && s.publisher === publisher
        && s.type === "global"
        && callback === callback
    );

    toRemove.forEach(t => {
        const index = this._subscribtions.global.indexOf(t);
        this._subscribtions.global.splice(index, 1)
    });
};

/**
 * Registers a callback for a switch event.
 * Events are :
 * - change : the switch changed value
 * - on : the switch was off and became on
 * - off : the switch was on and became on
 * 
 * If a game event or code called the set value if the switch but it
 * allready had that value, the events will not be published.
 * 
 * @param {string} eventName 
 * @param {number} switchId 
 * @param {Function} callback 
 */
Kuchulem_Events_Publisher.onSwitchEvent = function(eventName, switchId, callback, thisArg) {
    this._subscribtions.switches.push( new Kuchulem_Events_Subscribtion(
        eventName,
        switchId,
        "switch",
        callback,
        thisArg
    ));
};

/**
 * Unregisters a callback for a switch event.
 * 
 * @param {string} eventName 
 * @param {number} switchId 
 * @param {Function} callback 
 */
Kuchulem_Events_Publisher.offSwitchEvent = function(eventName, switchId, callback) {
    const toRemove = this._subscribtions.switches.filter( s => 
        s.eventName === eventName,
        s.switchId === switchId,
        s.type === "switch",
        s.callback === callback
    );

    toRemove.forEach(t => {
        const index = publisher._subscribtions.switches.indexOf(t);
        publisher._subscribtions.switches.splice(index, 1)
    });
};

/**
 * Publishes an event, the callback registered for this event will be
 * called.
 * 
 * @param {string} eventName 
 * @param {Object} publisherClass 
 */
Kuchulem_Events_Publisher.prototype.publish = function(eventName, publisher) {
    this._subscribtions.global.filter(
        s => s.eventName === eventName && publisher instanceof s.publisher
    ).forEach(
        s => s.thisArg ? s.callback.call(s.thisArg, publisher) : s.callback(publisher)
    );
};

/**
 * Publishes a switch event, the callback registered for this event will be
 * called.
 * 
 * @param {string} eventName 
 * @param {Object} publisherClass 
 */
Kuchulem_Events_Publisher.prototype.publishSwitchEvent = function(eventName, switchId, oldValue, newValue) {
    this._subscribtions.switches.filter(
        s => s.eventName === eventName && s.publisher === switchId
    ).forEach(
        s => s.thisArg ? s.callback.call(s.thisArg, publisher, oldValue, newValue) : s.callback(publisher, oldValue, newValue)
    );
};
//#endregion

Kuchulem.createGameObject("$eventsPublisher", new Kuchulem_Events_Publisher());

/**
 * Standard events for Spriteset_Base
 */
const Spriteset_Base_events = {
    beforeCreateUpperLayer: "beforeCreateUpperLayer",
    afterCreateUpperLayer: "afterCreateUpperLayer",
    beforeUpdate: "beforeUpdate",
    afterUpdate: "afterUpdate"
};

/**
 * Standard events for Game_Map
 */
const Game_Map_events = {
    beforeRefresh: "beforeRefresh",
    afterRefresh: "afterRefresh",
    beforeUpdate: "beforeUpdate",
    afterUpdate: "afterUpdate",
    beforeFirstRefresh: "beforeFirstRefresh",
    afterFirstRefresh: "afterFirstRefresh",
    beforeSetup: "beforeSetup",
    afterSetup: "afterSetup"
};
    

(() => {
    //#region Spriteset_Base events
    /**
     * Extends the Spriteset_Base.prototype.createUpperLayer to add an event
     */
    const Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
    Spriteset_Base.prototype.createUpperLayer = function() {
        $eventsPublisher.publish(Spriteset_Base_events.beforeCreateUpperLayer, this);
        Spriteset_Base_createUpperLayer.call(this, ...arguments);
        $eventsPublisher.publish(Spriteset_Base_events.afterCreateUpperLayer, this);
    };

    /**
     * Extends the Spriteset_Base.prototype.createUpperLayer to add an event
     */
    const Spriteset_Base_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
        $eventsPublisher.publish(Spriteset_Base_events.beforeUpdate, this);
        Spriteset_Base_update.call(this, ...arguments);
        $eventsPublisher.publish(Spriteset_Base_events.afterUpdate, this);
    };
    //#endregion

    //#region Game_Map events

    const Game_Map_setup_base = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function() {
        $eventsPublisher.publish(Game_Map_events.beforeSetup, this);
        Game_Map_setup_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map_events.afterSetup, this);
    };

    /**
     * Extends the Game_Map.prototype.refresh method to refresh the in-game clock
     */
    const Game_Map_refresh_base = Game_Map.prototype.refresh;
    Game_Map.prototype.refresh = function() {
        if (!this._hadRefresh) {
            $eventsPublisher.publish(Game_Map_events.beforeFirstRefresh, this);
        }
        $eventsPublisher.publish(Game_Map_events.beforeRefresh, this);
        Game_Map_refresh_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map_events.afterRefresh, this);
        if (!this._hadRefresh) {
            $eventsPublisher.publish(Game_Map_events.afterFirstRefresh, this);
            this._hadRefresh = true;
        }
    };

    /**
     * Extends the Game_Map.prototype.refresh method to refresh the in-game clock
     */
    const Game_Map_update_base = Game_Map.prototype.update;
    Game_Map.prototype.update = function() {
        $eventsPublisher.publish(Game_Map_events.beforeUpdate, this);
        const result = Game_Map_update_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map_events.afterUpdate, this);
        return result;
    };

    const Game_Switches_setValue_base = Game_Switches.prototype.setValue;
    Game_Switches.prototype.setValue = function(switchId, value) {
        let oldValue = null;
        if (switchId > 0 && switchId < $dataSystem.switches.length) {
            oldValue = this._data[switchId]; 
        }
        Game_Switches_setValue_base.call(this, ...arguments);
        if (oldValue !== this._data[switchId]) {
            $eventsPublisher.publishSwitchEvent("change", switchId, oldValue, this._data[switchId]);
            if (this._data[switchId])  {
                $eventsPublisher.publishSwitchEvent("on", switchId, oldValue, this._data[switchId]);
            } else {
                $eventsPublisher.publishSwitchEvent("off", switchId, oldValue, this._data[switchId]);
            }
        }
    }
    //#endregion
})();