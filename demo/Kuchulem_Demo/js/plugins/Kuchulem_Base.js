function Kuchulem() {
    throw new Error("This is a static class");
}

/*:
 * @target MZ
 * @plugindesc Adds basics methods used by Kuchulem plugins.
 * @author Kuchulem
 *
 * @help Kuchulem_Base.js
 *
 * Provides some methods to load data, create, save and reload game objects in
 * the same way as the original game intends to.
 * 
 * - Load a JSON database file
 * The file should be located in the data/ folder
 * 
 * 1. | Kuchulem.registerDatabaseFile("$dataMyData", "mydata.json");
 * 
 * This will load the data from the mydata.json file and store it to a global 
 * variable $dataMyData.
 * To keep the RPG Maker practice it is a good idea to prefix those variables
 * with $data.
 * 
 * - Creating a game object
 * 
 * To create a game object global variable it is recommended to use the
 * Kuchulem.createGameObject method.
 * 
 * 1. | const obj = new WonderfullObject();
 * 2. | Kuchulem.createGameObject("$gameWonderfullObject", obj);
 * 
 * This will store the object in the global variable $gameWonderfullObject.
 * It will be available exactly like the $gameMap or $gameSystem objects.
 * 
 * If you wich to include that object in the game saving process, set the third
 * variable to true :
 * 
 * 1. | const obj = new WonderfullObject();
 * 2. | Kuchulem.createGameObject("$gameWonderfullObject", obj, true);
 * 
 * The object will be created from scratch for a new game but when loading
 * a saved game, it will be loaded from the saved data
 */
(() => {
    const pluginName = "Kuchulem_Base";

    Kuchulem._gameObjectsToSave = [];

    /**
     * Registers a JSON file to be loaded with others database files.
     * The file should be located in the data/ folder alongside the "Actors.json",
     * "Items.json", etc. files.
     * 
     * will load the data from the json file and store it to a global 
     * variable.
     * To keep the RPG Maker practices it is a good idea to prefix those variables
     * with $data, ie: "$dataQuests".
     * 
     * @param {string} name The name of the global variable to store the data
     * @param {string} src The name of the JSON file where the data is written
     */
    Kuchulem.registerDatabaseFile = function(name, src) {
        DataManager._databaseFiles.push({ name: name, src: src });
    };

    /**
     * Creates a game object, like the $gameMap ou $gamePlayer objects.
     * If you need to add the object to the save process, set the addToSaves
     * parameter to true
     * 
     * @param {string} name 
     * @param {any} obj 
     * @param {boolean} addToSaves 
     */
    Kuchulem.createGameObject = function(name, obj, addToSaves) {
        window[name] = obj;

        if (addToSaves) {
            Kuchulem._gameObjectsToSave.push(name);
        }
    };

    /**
     * Overloads the DataManager.makeSaveContents method to add the game objects
     * created by the Kuchulem.createGameObject method when addToSaves is true.
     */
    const DataManager_makeSaveContents_base = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        const contents = DataManager_makeSaveContents_base();

        Kuchulem._gameObjectsToSave.forEach(gameObject => {
            contents[gameObject] = window[gameObject];
        });

        return contents;
    };

    /**
     * Overloads the DataManager.extractSaveContents method to add the game objects
     * created by the Kuchulem.createGameObject method when addToSaves is true.
     */
    const DataManager_extractSaveContents_base = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        DataManager_extractSaveContents_base(contents);

        Kuchulem._gameObjectsToSave.forEach(gameObject => {
            window[gameObject] = contents[gameObject];
        });
    };
})();