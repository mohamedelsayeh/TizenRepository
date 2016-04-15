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
 * Errors module.
 */

define({
    name: 'models/errors',
    def: function initApp() {
        'use strict';

        /**
         * Handler of invalid format error.
         * @param {string} [msg]
         * @class EquationInvalidFormatError
         * @augments Error
         * @constructor
         */
        function EquationInvalidFormatError(msg) {
            this.name = 'EquationInvalidFormatError';
            this.message = msg || 'Equation invalid format';
        }
        EquationInvalidFormatError.prototype = new Error();
        EquationInvalidFormatError.prototype.constructor =
            EquationInvalidFormatError;

        /**
         * Handler of division by zero error.
         * @param {string} [msg]
         * @class DivisionByZeroError
         * @augments Error
         * @constructor
         */
        function DivisionByZeroError(msg) {
            this.name = 'DivisionByZeroError';
            this.message = msg || 'Division by zero error';
        }
        DivisionByZeroError.prototype = new Error();
        DivisionByZeroError.prototype.constructor = DivisionByZeroError;

        /**
         * Handler of calculation error.
         * @param {string} [msg]
         * @class CalculationError
         * @augments Error
         * @constructor
         */
        function CalculationError(msg) {
            this.name = 'CalculationError';
            this.message = msg || 'Calculation error';
        }
        CalculationError.prototype = new Error();
        CalculationError.prototype.constructor = CalculationError;

        /**
         * Handler of infinity error.
         * @param {string} [pos] positive
         * @param {string} [msg]
         * @class InfinityError
         * @augments Error
         * @constructor
         * @requires {@link EquationInvalidFormatError}
         * @requires {@link DivisionByZeroError}
         * @requires {@link CalculationError}
         * @requires {@link InfinityError}
         */
        function InfinityError(pos, msg) {
            this.name = 'InfinityError';
            this.positive = pos;
            this.message = msg || 'Result equals +/- Infinity';
        }
        InfinityError.prototype = new Error();
        InfinityError.prototype.constructor = InfinityError;

        function init() {
            console.log('errors::init');
        }

        return {
            init: init,
            EquationInvalidFormatError: EquationInvalidFormatError,
            DivisionByZeroError: DivisionByZeroError,
            CalculationError: CalculationError,
            InfinityError: InfinityError
        };
    }
});
