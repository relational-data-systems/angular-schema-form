angular.module('schemaForm').directive('schemaValidate', ['sfValidator', '$parse', 'sfSelect', '$timeout',
  function (sfValidator, $parse, sfSelect, $timeout) {
    return {
      restrict: 'A',
      scope: false,
      // We want the link function to be *after* the input directives link function so we get access
      // the parsed value, ex. a number instead of a string
      priority: 500,
      require: 'ngModel',
      link: function (scope, element, attrs, ngModel) {
        // We need the ngModelController on several places,
        // most notably for errors.
        // So we emit it up to the decorator directive so it can put it on scope.
        scope.$emit('schemaFormPropagateNgModelController', ngModel);

        var error = null;
        var form = scope.$eval(attrs.schemaValidate);

        if (form.copyValueTo) {
          ngModel.$viewChangeListeners.push(function () {
            var paths = form.copyValueTo;
            angular.forEach(paths, function (path) {
              sfSelect(path, scope.model, ngModel.$modelValue);
            });
          });
        }

        // Custom validators, parsers, formatters etc
        if (typeof form.ngModel === 'function') {
          form.ngModel(ngModel);
        }

        ['$parsers', '$viewChangeListeners', '$formatters'].forEach(function (attr) {
          if (form[attr] && ngModel[attr]) {
            form[attr].forEach(function (fn) {
              ngModel[attr].push(fn);
            });
          }
        });

        ['$validators', '$asyncValidators'].forEach(function (attr) {
          // Check if our version of angular has validators, i.e. 1.3+
          if (form[attr] && ngModel[attr]) {
            angular.forEach(form[attr], function (fn, name) {
              ngModel[attr][name] = fn;
            });
          }
        });

        // Get in last of the parses so the parsed value has the correct type.
        // We don't use $validators since we like to set different errors depending tv4 error codes
        ngModel.$parsers.push(_validate);

        // But we do use one custom validator in the case of Angular 1.3 to stop the model from
        // updating if we've found an error.
        if (ngModel.$validators) {
          ngModel.$validators.schemaForm = function () {
            // console.log('validators called.')
            // Any error and we're out of here!
            return !Object.keys(ngModel.$error).some(function (e) { return e !== 'schemaForm' && e !== 'jsExpression' && e !== 'remoteValidation'&& e !== 'dateFormat' && e !== 'dateMin' && e !== 'dateMax';  });
          };
        }

        var schema = form.schema;

        // A bit ugly but useful.
        scope.validateField = validateField;

        // TODO: This seems like a hack, but it's what is happening on the schemaform demo page? first was previously scope.firstDigest
        // It solves the problem of forms validating when a condition passes and new fields are shown though
        var first = true;
        ngModel.$formatters.push(function (val) {
          // When a form first loads this will be called for each field.
          // we usually don't want that.
          if (ngModel.$pristine && first &&
              (!scope.options || scope.options.validateOnRender !== true)) {
            first = false; // added with fix
            return val;
          }
          if (!ngModel.$pristine) {
            _validate(ngModel.$modelValue);
          }
          return val;
        });

        // Listen to an event so we can validate the input on request
        scope.$on('schemaFormValidate', function (event, formName) {
          scope.validateField(formName);
        });

        scope.$on('internal-schemaFormValidate-revalidate-containing-array-if-any', function (event) {
          if (scope.form && scope.form.type === 'array') {
            scope.validateField();
            ngModel.$validate(); // To refresh the values of ngModel.$valid and ngModel.$invalid
          }
        });

        scope.schemaError = function () {
          return error;
        };

        // Validate against the schema
        function _validate (viewValue) {
          // Still might be undefined
          if (!form) {
            return viewValue;
          }

          // Omit TV4 validation
          if (scope.options && scope.options.tv4Validation === false) {
            return viewValue;
          }

          var result = sfValidator.validate(form, viewValue);

          // Since we might have different tv4 errors we must clear all
          // errors that start with tv4-
          Object.keys(ngModel.$error)
              .filter(function (k) { return k.indexOf('tv4-') === 0; })
              .forEach(function (k) { ngModel.$setValidity(k, true); });
          ngModel.$setValidity('jsExpression', true);
          ngModel.$setValidity('remoteValidation', true);

          if (!result.valid) {
            // it is invalid, return undefined (no model update)
            ngModel.$setValidity('tv4-' + result.error.code, false);
            error = result.error;

            // In Angular 1.3+ return the viewValue, otherwise we inadvertenly
            // will trigger a 'parse' error.
            // we will stop the model value from updating with our own $validator
            // later.
            if (ngModel.$validators) {
              return viewValue;
            }
            // Angular 1.2 on the other hand lacks $validators and don't add a 'parse' error.
            return undefined;
          } else {
            if (error !== null) {
              $timeout(function () {
                scope.$emit('internal-schemaFormValidate-revalidate-containing-array-if-any');
              });
            }
            error = null;
            if (form.jsExpressionResult === false) {
              ngModel.$setValidity('jsExpression', false);
              error = {'code': 'jsExpression'};
              return viewValue;
            } else if (form.remoteValidationResult === false) {
              ngModel.$setValidity('remoteValidation', false);
              error = {'code': 'remoteValidation'};
              return viewValue;
            } else {
              return viewValue;
            }
          }
        }

        function validateField (formName) {
          // If we have specified a form name, and this model is not within
          // that form, then leave things be.
          if (formName != undefined && ngModel.$$parentForm.$name !== formName) {
            return;
          }

          // Special case: arrays
          // TODO: Can this be generalized in a way that works consistently?
          // Just setting the viewValue isn't enough to trigger validation
          // since it's the same value. This will be better when we drop
          // 1.2 support.
          if (schema && schema.type.indexOf('array') !== -1) {
            _validate(ngModel.$modelValue);
          }

          // We set the viewValue to trigger parsers,
          // since modelValue might be empty and validating just that
          // might change an existing error to a "required" error message.
          if (ngModel.$setDirty) {
            // Angular 1.3+
            ngModel.$setDirty();
            ngModel.$setViewValue(ngModel.$viewValue);
            ngModel.$commitViewValue();

            // In Angular 1.3 setting undefined as a viewValue does not trigger parsers
            // so we need to do a special required check. Fortunately we have $isEmpty
            // FIXME: i think this should handle more than one case at a time if we want multiple messages displayed per field?
            // kelin: this is the messiest code I've ever met in schema form so far... ╮(╯▽╰)╭
            ngModel.$setValidity('tv4-302', true); // hotfix for not reset required validation
            if (form.required) {
              if (_isEmptyNgModel()) {
                ngModel.$setValidity('tv4-302', false);
                // kelin: Once the validity become false, return immediately. This is what schema form originally does. No bother to change atm
                return;
              } else {
                ngModel.$setValidity('tv4-302', true);
              }
            }

            if (form.jsExpressionResult === false) {
              ngModel.$setValidity('jsExpression', false);
              // kelin: Once the validity become false, return immediately. This is what schema form originally does. No bother to change atm
              return;
            } else if (form.jsExpressionResult) {
              ngModel.$setValidity('jsExpression', true);
            }

            if (form.remoteValidationResult === false) {
              ngModel.$setValidity('remoteValidation', false);
            } else if (form.remoteValidationResult) {
              ngModel.$setValidity('remoteValidation', true);
            }
          } else {
            // Angular 1.2
            // In angular 1.2 setting a viewValue of undefined will trigger the parser.
            // hence required works.
            ngModel.$setViewValue(ngModel.$viewValue);
          }

          function _isEmptyNgModel () {
            return ngModel.$isEmpty(ngModel.$modelValue) ||
              ((schema && schema.type.indexOf('array') !== -1) && angular.equals(ngModel.$modelValue, []));
          }
        }
      }
    };
  }]);
