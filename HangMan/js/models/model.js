/*
 *      Copyright (c) 2014 Samsung Electronics Co., Ltd
 *
 *      Licensed under the Flora License, Version 1.1 (the "License");
 *      you may not use this file except in compliance with the License.
 *      You may obtain a copy of the License at
 *
 *              http://floralicense.org/license/
 *
 *      Unless required by applicable law or agreed to in writing, software
 *      distributed under the License is distributed on an "AS IS" BASIS,
 *      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *      See the License for the specific language governing permissions and
 *      limitations under the License.
 */

/*global define, console*/

/**
 * Main view module.
 */
define({
    name: 'models/model',
    requires: [
        'models/errors'
    ],
    def: function initView(errors) {
        'use strict';

        /**
         * Operators.
         * @const
         * @type {string[]}
         */
        var OPERATORS = ['+', '-', '*', '/'],

            /**
             * Decimal separator.
             * @const
             * @type {string}
             */
            DECIMAL = '.',

            /**
             * Maximum count of digits in the equation.
             * @const
             * @type {number}
             */
            MAX_DIGITS = 9,


            /**
             * Exponential regular expression.
             * @const
             * @type {RegExp}
             */
            EXPONENTIAL_REGEXP = /E[\-\+]?$/i,

            /**
             * Open bracket sign
             * @const
             * @type {string}
             */
            BRACKET_OPEN = '(',

            /**
             * Close bracket sign
             * @const
             * @type {string}
             */
            BRACKET_CLOSE = ')',

            /**
             * Equation elements.
             * @type {string[]}
             */
            equation = [],

            /**
             * Indicates whether the equation is calculated or not..
             * @type {boolean}
             */
            calculated = false,

            /**
             * Last calculated result.
             * @type {number|string}
             */
            lastCalculationResult = '';

        /**
         * Retruns equation.
         * @return {string}
         */
        function getEquation() {
            return equation;
        }

        /**
         * Resets equation.
         */
        function resetEquation() {
            equation = [];
            calculated = false;
        }

        /**
         * Returns true if equation is empty, false otherwise.
         * @return {boolean}
         */
        function isEmpty() {
            return equation.length === 0;
        }

        /**
         * Returns last component of equation.
         * If not exist, null is returned.
         * @param {boolean} correct
         * @return {string|null}
         */
        function getLastComponent(correct) {
            var last = equation[equation.length - 1] || null;

            if (correct && last && last.slice(-1) === DECIMAL) {
                last = last.slice(0, -1);
                last.replace('.)', ')');
                equation[equation.length - 1] = last;
            }
            return last;
        }

        /**
         * Replaces last equation component with specified value.
         * @param {string} value
         */
        function replaceLastComponent(value) {
            var length = equation.length;

            if (length > 0) {
                equation[length - 1] = value;
                calculated = false;
            }
        }

        /**
         * Adds new component to equation.
         * @param {string} value
         */
        function addComponent(value) {
            equation.push(value);
            calculated = false;
        }

        /**
         * Returns true if specified value is an operator, false otherwise.
         * @param {string} value
         * @return {boolean}
         */
        function isOperator(value) {
            return OPERATORS.indexOf(value) !== -1;
        }

        /**
         * Checks if component is negative and fixes its format.
         * @param {string} component
         * @return {string}
         */
        function checkNegativeFormat(component) {
            if (component && component.match(/^\-d+/)) {
                component = '(' + component + ')';
            }
            return component;
        }

        /**
         * Checks if component represents negative digit
         * @return {boolean}
         */
        function isNegativeComponent(component) {
            return (new RegExp('(\\()\\-(.*?)(\\))')).test(component);
        }

        /**
         * Checks if given value is one of bracket signs.
         * @param {string} val
         * @return {boolean}
         */
        function isBracket(val) {
            return (val === BRACKET_CLOSE || val === BRACKET_OPEN);
        }

        /**
         * Adds digit to equation.
         * @param {string} digit
         * @return {boolean} True for success | false for fail.
         */
        function addDigit(digit) {
            /*jshint maxcomplexity:11 */
            var last = null;

            if (calculated) {
                resetEquation();
            }

            last = getLastComponent();

            // If the previous one is not a number
            // only start a new component,
            // unless there is only a minus before.
            if (
                ((!last || isOperator(last)) || isBracket(last)) &&
                (last !== '-' || equation.length > 1)
            ) {
                addComponent(digit);
                return true;
            }
            replaceLastComponent(checkNegativeFormat(last));

            if (isNegativeComponent(last) || last === '-') {
                last =
                    '(-' +
                    (RegExp.$2 === '0' ? '' : RegExp.$2) +
                    digit +
                    ')';
            } else if (last === '0') {
                last = digit;
            } else {
                last = last + digit;
            }
            if (last.replace(new RegExp('[^\\d]', 'g'), '')
                .length <= MAX_DIGITS) {
                replaceLastComponent(last);
                return true;
            }
            return false;
        }

        /**
         * Adds operator to equation.
         * @param {string} operator
         */
        function addOperator(operator) {
            var last = null;

            if (calculated) {
                resetEquation();
                addComponent(lastCalculationResult);
            }

            last = getLastComponent(true);

            // Operators other than '-' cannot be added to empty equations
            if (!last && operator !== '-') {
                return;
            }
            // Cannot replace minus if on first position
            if (last === '-' && equation.length === 1) {
                return;
            }

            replaceLastComponent(checkNegativeFormat(last));

            if (isOperator(last)) {
                // replace last operator with a new one
                replaceLastComponent(operator);
            } else {
                // check for 'E' being the last character of the equation
                if (last && last.match(/E$/)) {
                    // add '-' to the number, ignore other operators
                    if (operator === '-') {
                        replaceLastComponent(last + '-');
                    }
                } else {
                    // add operator
                    addComponent(operator);
                }
            }
        }

        /**
         * Adds decimal point to equation.
         */
        function addDecimal() {
            var last = getLastComponent();

            if (!last || isOperator(last)) {
                addComponent('0' + DECIMAL);
            } else {
                replaceLastComponent(checkNegativeFormat(last));
                if (last.indexOf(DECIMAL) === -1) {
                    if (isNegativeComponent(last)) {
                        last = '(-' + RegExp.$2 + DECIMAL + ')';
                    } else {
                        last += DECIMAL;
                    }
                    replaceLastComponent(last);
                }
            }
        }

        /**
         * Removes last character from the given string.
         * @param {string} str
         */
        function removeLastChar(str) {
            return str.substring(0, str.length - 1)
                .replace(EXPONENTIAL_REGEXP, '');
        }

        /**
         * Deletes last element from equation (digit or operator).
         */
        function deleteLast() {
            var last = null,
                lastPositive;

            if (calculated) {
                resetEquation();
                addComponent(lastCalculationResult);
                return;
            }

            last = getLastComponent();

            if (!last) {
                return;
            }

            replaceLastComponent(checkNegativeFormat(last));

            if (isNegativeComponent(last)) {
                lastPositive = RegExp.$2;
                if (lastPositive.length === 1) {
                    equation.pop();
                } else {
                    replaceLastComponent(
                        '(-' + removeLastChar(lastPositive) + ')'
                    );
                }
            } else if (last.length === 1 || last.match(/^\-[0-9]$/)) {
                equation.pop();
            } else {
                replaceLastComponent(removeLastChar(last));
            }
        }

        /**
         * Returns true if equation can be calculated, false otherwise.
         * @return {boolean}
         */
        function isValidEquation() {
            var last = getLastComponent(true);

            return (!isOperator(last) && !last.match(/E-?$/));
        }

        /**
         * Replaces left operand with specified value.
         * @param {string} value
         */
        function replaceLeftOperand(value) {
            var length = equation.length,
                leftOperandSize = 0;

            if (length === 0) {
                return;
            }
            if (length === 1) {
                leftOperandSize = 0;
            } else if (length === 2) {
                leftOperandSize = 1;
            } else {
                leftOperandSize = length - 3;
            }

            equation.splice(0, leftOperandSize);
            equation[0] = value;
            calculated = false;
        }

        /**
         * Formats value.
         * @param {number} value
         * @return {string}
         */
        function formatValue(value) {
            var formatted = '',
                textValue = '',
                dotIndex = 0;

            // Round the mantissa to the nearest integer if it won't fit
            textValue = value.toString();
            dotIndex = textValue.indexOf('.');
            if (dotIndex >= MAX_DIGITS) {
                // If two first digits of the mantissa are higher than 95,
                // then round the result i.e. 0.95 and higher will be rounded
                // to 1
                // This is the behavior of the Calculator app in Samsung phones
                if (parseInt(textValue.substr(
                        dotIndex + 1,
                        Math.min(textValue.length, 2)
                    ), 10) >= 95) {
                    value += 1;
                }
            }
            // Set precision to match 10 digits limit
            formatted = value.toFixed(MAX_DIGITS).toString();
            formatted = formatted.substr(
                0,
                MAX_DIGITS + formatted.replace(/\d/g, '').length
            ).replace(/(\.(0*[1-9])*)0+$/, '$1').replace(/\.$/, '');

            // If the number:
            // - is too big (exceeds digits limit), or
            // - is too small (rounds to zero), or
            // - has scientific notation without decimals (1E23 vs 1.00000E23)
            // then use properly formatted scientific notation
            if (
                (formatted === '0' && value !== 0) ||
                value.toString().match(/[eE]/) ||
                Math.abs(value) >= Math.pow(10, 10)
            ) {
                formatted =
                    value.toExponential(5).toString();
            }
            // Uppercase 'E', remove optional '+' from exponent
            formatted = formatted.toUpperCase().replace('E+', 'E');

            return formatted;
        }

        /**
         * Changes sign of last component (if applicable).
         * Returns true if sign was changed, false otherwise.
         * @return {boolean}
         */
        function changeSign() {
            var last;

            if (calculated) {
                resetEquation();
                addComponent(lastCalculationResult);
            }

            last = getLastComponent();
            // if there is at least one component
            // and last component isn't operator
            // and last component isn't zero
            if (last && !isOperator(last) && last !== '0') {
                if ((/^\-/).test(last)) {
                    last = '(' + last + ')';
                }
                if (isNegativeComponent(last)) {
                    last = RegExp.$2; // assign last matched value
                } else {
                    last = '(-' + last + ')';
                }
                replaceLastComponent(last);
                return true;
            }

            return false;
        }

        /**
         * Calculates equation value.
         * @return {string}
         */
        function calculate() {
            /*jslint evil:true*/
            /*jslint unparam: true*/
            var evaluation = '',
                result,
                /**
                 * Checks if the matched number is zero.
                 * @param {string} m Whole match including the division
                 * operator.
                 * @param {string} p1 Whole number, including sign and
                 * parenthesis.
                 * @param {string} number The matched number.
                 * @return {string}
                 */
                checkDivisionByZero = function checkDivisionByZero(m, p1,
                    number) {
                    if (parseFloat(number) === 0) {
                        throw new errors.DivisionByZeroError();
                    }
                    return '/ ' + number;
                };

            if (calculated) {
                replaceLeftOperand(lastCalculationResult);
            }

            if (!isValidEquation()) {
                throw new errors.EquationInvalidFormatError();
            }

            calculated = false;

            // Evaluate the equation.
            try {
                evaluation = equation.join(' ');
                evaluation = evaluation.replace(
                    /\/ *(\(?\-?([0-9\.]+)\)?)/g,
                    checkDivisionByZero
                );

                result = eval('(' + evaluation + ')');
                if (Math.abs(result) < 1.0E-300) {
                    result = 0;
                }
            } catch (e) {
                console.error(e);
                throw new errors.CalculationError();
            }

            if (isNaN(result)) {
                throw new errors.CalculationError();
            }
            if (result === Infinity || result === -Infinity) {
                throw new errors.InfinityError(result === Infinity);
            }

            calculated = true;
            // Format the result value.
            result = formatValue(result);
            // Save the calculated result.
            lastCalculationResult = result;

            return result;
        }

        /**
         * Finds specified component in the equation.
         * @param {string} val Search for value in the equation.
         * @return {string[]}
         */
        function findComponent(val) {
            return equation.filter(function findComp(eqComp) {
                return eqComp === val;
            });
        }

        /**
         * Search for specified component in equation and
         * return the number of occurrence.
         * @param {string} val Searched value.
         * @return {number}
         */
        function countComponent(val) {
            var found = findComponent(val);
            return found ? found.length : 0;
        }

        /**
         * Checks if given string is numeric value.
         * @param {string} str
         * @returns {boolean}
         */
        function isNumeric(str) {
            return /^\d+$/.test(str);
        }

        /**
         * Adds bracket sign to equation
         */
        function addBracket() {
            var last = getLastComponent(),
                countOpened = countComponent(BRACKET_OPEN),
                countClosed = countComponent(BRACKET_CLOSE),
                i = 0,
                sign = '',
                l = 0;

            if (isEmpty(last)) {
                sign = BRACKET_OPEN;
            } else if (isBracket(last)) {

                if (last === BRACKET_CLOSE && countOpened > countClosed) {
                    sign = BRACKET_CLOSE;
                } else {
                    // Two or more brackets next to each other must be opened
                    sign = BRACKET_OPEN;
                }
            } else if (isNumeric(last) && countOpened === countClosed) {
                // If all brackets are closed or are not present at all
                // and if bracket is clicked just after digit by default
                // multiply operator is added.
                sign = '*' + BRACKET_OPEN;
                // if last component is operator open bracket is added
            } else if (isOperator(last)) {
                sign = BRACKET_OPEN;
                // close bracket
            } else if (last !== BRACKET_CLOSE && last !== BRACKET_OPEN &&
                (countOpened > countClosed)) {
                sign = BRACKET_CLOSE;
            } else {
                // default
                sign = BRACKET_OPEN;
            }

            l = sign.length;
            for (i = 0; i < l; i += 1) {
                addComponent(sign[i]);
            }
        }

        /**
         * Initializes the model.
         */
        function init() {
            resetEquation();
        }

        return {
            init: init,
            getEquation: getEquation,
            addDigit: addDigit,
            isNegativeComponent: isNegativeComponent,
            calculate: calculate,
            resetEquation: resetEquation,
            addOperator: addOperator,
            addDecimal: addDecimal,
            deleteLast: deleteLast,
            changeSign: changeSign,
            addBracket: addBracket,
            isEmpty: isEmpty
        };
    }
});
