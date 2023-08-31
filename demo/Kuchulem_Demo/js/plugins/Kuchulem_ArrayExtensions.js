/*:
 * @target MZ
 * @plugindesc Extension methods of the Array object.
 * @author Kuchulem
 *
 * @help Kuchulem_ArrayExtensions.js
 * 
 * Adds methods to the Array prototype
 */
(() => {
    /**
     * Gets the first element of the array. If a predicate is provided, returns
     * the first element of the array filtered with the predicate.
     * 
     * @param {Function} predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param {*} thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns {*}
     */
    Array.prototype.first = function() {
        if (arguments.length > 0) {
            return this.filter(...arguments).first();
        }

        return this[0];
    }

    /**
     * Gets the last element of the array. If a predicate is provided, returs
     * the last element of the array filtered with the predicate.
     * 
     * @param {Function} predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param {*} thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns {*}
     */
    Array.prototype.last = function() {
        if (arguments.length > 0) {
            return this.filter(...arguments).last();
        }

        return this[this.length - 1];
    }

    /**
     * Checks if any element is in the array. If a predicate is provided,
     * returns true if the array filtered with the predicate has any element, 
     * return false otherwise
     * 
     * @param {Function} predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param {*} thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns {*}
     */
    Array.prototype.any = function() {
        if (arguments.length > 0) {
            return this.filter(...arguments).any();
        }

        return this.length > 0;
    }
})();