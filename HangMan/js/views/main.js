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

/*global define, document, window,tizen, console*/

/**
 * Main view module.
 */
define({
    name: 'views/main',
    requires: [
        'models/errors',
        'models/model'
    ],
    def: function main(errors, model) {
        'use strict';

        var showLives = document.getElementById("lives");
        
        var livesCounter = 1;
        
        /**
         * Delay after which longtap event is executed.
         * @const
         * @type {number}
         */
        var LONGTAP_DELAY = 400,

            /**
             * Interval of processing longtap event.
             * @const
             * @type {number}
             */
            LONGTAP_REPEAT_INTERVAL = 20,

            /**
             * Maximum count of digits in the equation.
             * @const
             * @type {number}
             */
            MAX_DIGITS = 9,

            /**
             * Minimum number of digits in the equation after which font is
             * decreased.
             * @const
             * @type {number}
             */
            SMALL_FONT_THRESHOLD = 7,

            /**
             * Container for timers of longtap events.
             * @const
             * @type {object}
             */
            longTapRepeatTimers = {},

            /**
             * Object that maps calculator signs to the HTML version.
             * @type {object}
             */
            operatorDisplays = {
                '+': '+',
                '-': '&minus;',
                '*': '&times;',
                '/': '&divide;'
            },

            /**
             * @type {object} Operator keys.
             */
            operatorKeys = {
                'add': '+',
                'sub': '-',
                'mul': '*',
                'div': '/'
            },

            /**
             * Result element.
             * @type {HTMLElement}
             */
            resultElement = null,

            /**
             * Result value element.
             * @type {HTMLElement}
             */
            resultValueElement = null,

            /**
             * Equation element.
             * @type {HTMLElement}
             */
            equationElement = null,

            /**
             * Display element.
             * @type {HTMLElement}
             */
            displayElement = null,

            /**
             * Error flag.
             * @type {boolean}
             */
            error = false,

            /**
             * Calculation success flag.
             * @type {boolean}
             */
            result = false,

            /**
             * Separator.
             * @const
             * type {string}
             */
            SEPARATOR = ',';

        /**
         * Handles touch events.
         * Disables multitouch.
         * @param {object} ev
         */
        function filterTap(ev) {
            // disable multitouch
            if (ev.touches.length > 1) {
                ev.stopPropagation();
                ev.preventDefault();
            }
        }

        /**
         * Clears registered timers.
         * @param {string} key
         */
        function clearLongTapRepeatTimers(key) {
            if (longTapRepeatTimers['start' + key]) {
                window.clearTimeout(longTapRepeatTimers['start' + key]);
                longTapRepeatTimers['start' + key] = null;
            }

            if (longTapRepeatTimers['repeat' + key]) {
                window.clearInterval(longTapRepeatTimers['repeat' + key]);
                longTapRepeatTimers['repeat' + key] = null;
            }
        }

        /**
         * Returns true for result, false for empty result.
         * @return {boolean}
         */
        function isResultVisible() {
            return result;
        }

        /**
         * Clears result element.
         * @private
         */
        function clear() {
            equationElement.classList.remove('top');
            displayElement.classList.add('empty-result');
        }

        /**
         * Clears result element and flags.
         */
        function clearResult() {
            clear();
            result = false;
            error = false;
        }


        /**
         * Shows string in result element.
         * @param {string} result
         * @param {boolean} error Error flag.
         * @private
         */
        function show(result, error) {
            if (result === '') {
                return clear();
            }

            equationElement.classList.add('top');
            displayElement.classList.remove('empty-result');

            if (error === true) {
                resultElement.classList.add('error');
                if (result.length > MAX_DIGITS) {
                    resultElement.classList.add('small');
                } else {
                    resultElement.classList.remove('small');
                }
            } else {
                resultElement.classList.remove('error');
                resultElement.classList.remove('small');
            }

            resultValueElement.innerHTML = result.replace(/-/g, '&minus;');
        }

        /**
         * Shows error in result element.
         * @param {string} error
         */
        function showError(error) {
            show(error, true);
            error = true;
        }

        /**
         * Handles pressing digit button.
         * @param {object} key
         */
        function pushDigits(key) {
            if (!model.addDigit(key)) {
                showError('Only 10 digits available');
            }
        }

        /**
         * Adds seperators to matched string.
         * @param  {string} match
         * @param  {string} sign
         * @param  {string} p1
         * @return {sting}
         */
        function regexpReplacer(match, sign, p1) {
            var p1array;

            p1 = p1.split('').reverse().join('');
            p1array = p1.match(new RegExp('.{1,3}', 'g'));
            p1 = p1array.join(SEPARATOR);
            p1 = p1.split('').reverse().join('');
            return sign + p1;
        }


        /**
         * Adds separators to the specified equation.
         * @param {string} equationString
         * @returns {string} Equation with separators.
         */
        function addSeparators(equationString) {
            var negative = false;

            if (model.isNegativeComponent(equationString)) {
                equationString = RegExp.$2;
                negative = true;
            }
            equationString = equationString.replace(
                new RegExp('^(\\-?)([0-9]+)', 'g'),
                regexpReplacer
            );
            return negative ? '(-' + equationString + ')' : equationString;
        }

        /**
         * Shows result in result element.
         * @param {string} res result
         * @param {boolean} err Error flag.
         */
        function showResult(res, err) {
            error = err || false;
            if (error) {
                error = true;
            }
            show(res, err);
            result = true;
        }

        /**
         * Calculates equation and displays result on the screen.
         */
        function calculate() {
            var calculationResult = '';

            try {
                calculationResult = model.calcculate();
                calculationResult = addSeparators(calculationResult);
                showResult('=&nbsp;' + calculationResult);
            } catch (e) {
                if (e instanceof errors.EquationInvalidFormatError) {
                    showResult('Wrong format');
                } else if (e instanceof errors.CalculationError) {
                    showResult('Invalid operation');
                } else if (e instanceof errors.InfinityError) {
                    showResult(
                        (e.positive ? '' : '&minus;') + '&infin;'
                    );
                } else {
                    showError('Unknown error.');
                    console.warn(e);
                }
            }
        }

        /**
         * Displays given equation.
         * @param {string} equation
         */
        function showEquation(equation) {
            var e, element, elementText, span, length;

            equationElement.innerHTML = '';

            length = equation.length;
            for (e = 0; e < length; e += 1) {
                element = equation[e];
                span = document.createElement('span');
                elementText = element;
                if (Object.keys(operatorDisplays).indexOf(element) !== -1) {
                    span.className = 'operator';
                    elementText = operatorDisplays[element];
                } else {
                    elementText = addSeparators(elementText);
                }
                elementText = elementText.replace(/-/g, '&minus;');
                span.innerHTML = elementText;
                equationElement.appendChild(span);
            }

            if (equation[0] && equation[0].length >= SMALL_FONT_THRESHOLD) {
                equationElement.classList.add('medium');
            } else {
                equationElement.classList.remove('medium');
            }
        }

        /**
         * Refreshes equation field.
         */
        function refreshEquation() {
            showEquation(model.getEquation());
        }

        /**
         * Handles press key event.
         * @param {object} key
         */
        function processKey(key) {
            /*jshint maxcomplexity:11 */
            var keys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            
            
            if(keys.indexOf(key) == 4){
        		var dashesDiv = document.getElementById('equation');
            	dashesDiv = 'e';
            	dashesDiv += '-';
            	dashesDiv += '-';
            	dashesDiv += '-';
            	dashesDiv += '-';
        		
        		}
            else if (keys.indexOf(key) !== -1) {
            	
            	
            	if(livesCounter <= 4){
            		$('#heart'+livesCounter).removeClass('heart');
                    $('#heart'+livesCounter).addClass('end');
                    livesCounter++;
            	}
            	else{
            		celebration();
            	}
            		
            	
            	
            } else if (Object.keys(operatorKeys).indexOf(key) !== -1) {
                model.addOperator(operatorKeys[key]);
            }
            if (key === 'eql') {
            	lostGame();
            }
        }

        /**
         * Registers view event listeners.
         */
        function bindEvents() {
            var numpad = document.getElementById('numpad');

            numpad.addEventListener('touchstart', function onTouchStart(e) {
                var key = '',
                    target = e.target,
                    classList = target.classList;

                if (!classList.contains('key') &&
                    !classList.contains('longkey')) {
                    return;
                }
                classList.add('press');
                key = target.id.replace(/key_/, '');
                if (classList.contains('long-tap-repeat')) {
                    longTapRepeatTimers['start' + key] = window.setTimeout(
                        function longtapStart() {
                            processKey(key);
                            longTapRepeatTimers['repeat' + key] =
                                window.setInterval(
                                    function longtapRepeat() {
                                        processKey(key);
                                    },
                                    LONGTAP_REPEAT_INTERVAL
                                );
                        },
                        LONGTAP_DELAY
                    );
                } else {
                    processKey(key);
                }

            });
            numpad.addEventListener('touchend', function onTouchEnd(e) {
                var key = '',
                    target = e.target,
                    classList = target.classList;

                if (!classList.contains('key') &&
                    !classList.contains('longkey')) {
                    return;
                }
                classList.remove('press');
                key = target.id.replace(/key_/, '');
                if (classList.contains('long-tap-repeat') &&
                    !longTapRepeatTimers['repeat' + key]) {
                    if (e.touches.length === 0) {
                        processKey(key);
                    }
                }
                clearLongTapRepeatTimers(key);
            });
            numpad.addEventListener('touchcancel', function onTouchCancel(e) {
                var key = '',
                    target = e.target,
                    classList = target.classList;

                if (!classList.contains('key') &&
                    !classList.contains('longkey')) {
                    return;
                }
                classList.remove('press');
                key = target.id.replace(/key_/, '');
                clearLongTapRepeatTimers(key);
            });
            document.addEventListener('tizenhwkey', function onTizenHwKey(e) {
                if (e.keyName === 'back') {
                    try {
                        tizen.application.getCurrentApplication().exit();
                    } catch (ignore) {}
                }
            });
        }
        
        function drawHearts()
        {
        	for (var i = 1; i <= 4; i++)
        	{
        	      var heart = document.createElement('div')
        	      heart.setAttribute('class','heart');
        	      heart.setAttribute('id','heart'+i);
        	      showLives.appendChild(heart);
        	 }
        }
        
        function celebration() {
        	  $('.winning').css('display','block');
        	    $('.winning').animate({
        	        opacity: 1,
        	        fontSize: '33px'
        	    }, 300);

        	    setTimeout(function(){
        	        $('.winning').animate({
        	            opacity: 0,
        	            fontSize: '10px'
        	        }, 500);
        	        
        	        $('.winning span').animate({
        	            top: '38%'
        	        });
        	    }, 1000);
        	    setTimeout(function(){
        	      $('.winning').css('display','none');
        	    },1600);
        	}
        
        function lostGame() {
      	  $('.losing').css('display','block');
      	    $('.losing').animate({
      	        opacity: 1,
      	        fontSize: '33px'
      	    }, 300);

      	    setTimeout(function(){
      	        $('.losing').animate({
      	            opacity: 0,
      	            fontSize: '10px'
      	        }, 500);
      	        
      	        $('.losing span').animate({
      	            top: '38%'
      	        });
      	    }, 1000);
      	    setTimeout(function(){
      	      $('.losing').css('display','none');
      	    },1600);
      	}
        
        function drawDashes()
        {
        	var dashesDiv = document.getElementById('equation');
        	for (var i = 0; i < 4; i++) {
        		dashesDiv.innerHTML += "-"
        	}
        	
        }
        
        /**
         * Initializes UI module.
         *
         * Following actions are performed:
         * - assignment of the most significant UI elements to the variables
         * - events binding
         * - preloading images
         * - clearing error state
         * - clearing result state
         * - disabling multitouch
         *
         */
        function init() {
            equationElement = document.getElementById('equation');
            displayElement = document.getElementById('display');
            bindEvents();
            // disable multitouch
            document.body.addEventListener('touchstart', filterTap, true);
            document.body.addEventListener('touchend', filterTap, true);
            drawHearts();
            drawDashes();
        }

        return {
            init: init
        };
    }
});
