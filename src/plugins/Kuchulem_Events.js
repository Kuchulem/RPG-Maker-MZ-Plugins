if (!Kuchulem) {
    throw new Error("Kuchulem_Events requires Kuchulem plugin to be loaded first");
}

Kuchulem.Events = {
    pluginName: "Kuchulem_Events"
};

/*:
 * @target MZ
 * @plugindesc Adds and events publisher on specific methods of RMMZ core classes.
 * @author Kuchulem
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
(() => {
    //#region Kuchulem.Events.Subscribtion class definition
    /**
     * Represents a subscribtion
     * 
     * @class
     * @constructor
     * @param {string} eventName 
     * @param {Object} publisherClass 
     * @param {Function} callback 
     */
    Kuchulem.Events.Subscribtion = function() {
        this.initialize(...arguments);
    }

    /**
     * Initializes the subscribtion
     * 
     * @param {string} eventName 
     * @param {*} publisherClass 
     * @param {Function} callback 
     */
    Kuchulem.Events.Subscribtion.prototype.initialize = function(eventName, publisherClass, callback) {
        this._eventName = eventName;
        this._publisherClass = publisherClass;
        this._callback = callback;
    }

    /**
     * The event name registered
     *
     * @readonly
     * @type string
     * @name Kuchulem.Events.Subscribtion#eventName
     */
    Object.defineProperty(Kuchulem.Events.Subscribtion.prototype, "eventName", {
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
     * @name Kuchulem.Events.Subscribtion#publisherClass
     */
    Object.defineProperty(Kuchulem.Events.Subscribtion.prototype, "publisherClass", {
        get: function() {
            return this._publisherClass;
        },
        configurable: true
    });

    /**
     * The callback to be called when event is triggered
     *
     * @readonly
     * @type Function
     * @name Kuchulem.Events.Subscribtion#callback
     */
    Object.defineProperty(Kuchulem.Events.Subscribtion.prototype, "callback", {
        get: function() {
            return this._callback;
        },
        configurable: true
    });
    //#endregion	

    //#region Kuchulem.Events.Publisher class definition
    /**
     * The class that will manage the events
     * 
     * @class
     */
    Kuchulem.Events.Publisher = function() {
        this._subscribtions = [];
    }

    /**
     * Registers a callback for an event
     * 
     * @param {string} eventName 
     * @param {Object} publisherClass 
     * @param {Function} callback 
     */
    Kuchulem.Events.Publisher.prototype.on = function(eventName, publisherClass, callback) {
        this._subscribtions.push(
            new Kuchulem.Events.Subscribtion(eventName, publisherClass, callback)
        );
    }

    /**
     * Unregisters a callback for an event
     * 
     * @param {string} eventName 
     * @param {Object} publisherClass 
     * @param {Function} callback 
     */
    Kuchulem.Events.Publisher.prototype.off = function(eventName, publisherClass, callback) {
        var publisher = this;
        var toRemove = this._subscribtions.filter(s =>
            s.eventName === eventName && s.publisherClass === publisherClass && callback === callback
        );

        toRemove.forEach(t => {
            var index = publisher._subscribtions.indexOf(t);
            publisher._subscribtions.splice(index, 1)
        });
    }

    /**
     * Publishes an event, the callback registered for this event will be
     * called.
     * 
     * @param {string} eventName 
     * @param {Object} publisherClass 
     */
    Kuchulem.Events.Publisher.prototype.publish = function(eventName, publisher) {
        this._subscribtions.filter(
            s => s.eventName === eventName && publisher instanceof s.publisherClass
        ).forEach(
            s => s.callback(publisher)
        );
    }
    //#endregion

    Kuchulem.createGameObject("$eventsPublisher", new Kuchulem.Events.Publisher());

    //#region Spriteset_Base events
    /**
     * Standard events for Spriteset_Base
     */
    Spriteset_Base.events = {
        beforeCreateUpperLayer: "beforeCreateUpperLayer",
        afterCreateUpperLayer: "afterCreateUpperLayer",
        beforeUpdate: "beforeUpdate",
        afterUpdate: "afterUpdate"
    };

    /**
     * Extends the Spriteset_Base.prototype.createUpperLayer to add an event
     */
    const Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
    Spriteset_Base.prototype.createUpperLayer = function() {
        $eventsPublisher.publish(Spriteset_Base.events.beforeCreateUpperLayer, this);
        Spriteset_Base_createUpperLayer.call(this, ...arguments);
        $eventsPublisher.publish(Spriteset_Base.events.afterCreateUpperLayer, this);
    };

    /**
     * Extends the Spriteset_Base.prototype.createUpperLayer to add an event
     */
    const Spriteset_Base_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
        $eventsPublisher.publish(Spriteset_Base.events.beforeUpdate, this);
        Spriteset_Base_update.call(this, ...arguments);
        $eventsPublisher.publish(Spriteset_Base.events.afterUpdate, this);
    };
    //#endregion

    //#region Game_Map events
    Game_Map.events = {
        beforeRefresh: "beforeRefresh",
        afterRefresh: "afterRefresh",
        beforeUpdate: "beforeUpdate",
        afterUpdate: "afterUpdate",
        beforeFirstRefresh: "beforeFirstRefresh",
        afterFirstRefresh: "afterFirstRefresh",
        beforeSetup: "beforeSetup",
        afterSetup: "afterSetup"
    }

    const Game_Map_setup_base = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function() {
        $eventsPublisher.publish(Game_Map.events.beforeSetup, this);
        Game_Map_setup_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map.events.afterSetup, this);
    }

    /**
     * Extends the Game_Map.prototype.refresh method to refresh the in-game clock
     */
    const Game_Map_refresh_base = Game_Map.prototype.refresh;
    Game_Map.prototype.refresh = function() {
        if (!this._hadRefresh) {
            $eventsPublisher.publish(Game_Map.events.beforeFirstRefresh, this);
        }
        $eventsPublisher.publish(Game_Map.events.beforeRefresh, this);
        Game_Map_refresh_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map.events.afterRefresh, this);
        if (!this._hadRefresh) {
            $eventsPublisher.publish(Game_Map.events.afterFirstRefresh, this);
            this._hadRefresh = true;
        }
    }

    /**
     * Extends the Game_Map.prototype.refresh method to refresh the in-game clock
     */
    const Game_Map_update_base = Game_Map.prototype.update;
    Game_Map.prototype.update = function() {
        $eventsPublisher.publish(Game_Map.events.beforeUpdate, this);
        const result = Game_Map_update_base.call(this, ...arguments);
        $eventsPublisher.publish(Game_Map.events.afterUpdate, this);
        return result;
    }
    //#endregion
})();