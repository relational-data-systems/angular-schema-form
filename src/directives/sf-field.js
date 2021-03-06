/**
 * Created by Luke on 31/08/2016.
 */
angular.module('schemaForm').directive('sfField',
  ['$parse', '$compile', '$http', '$templateCache', '$interpolate', '$q', 'sfErrorMessage',
    'sfPath', 'sfSelect', 'sfModelValue', '$log', '$timeout', 'LoadingSpinnerService', '$sce', '__sfbEnv',
    function ($parse, $compile, $http, $templateCache, $interpolate, $q, sfErrorMessage,
                 sfPath, sfSelect, sfModelValue, $log, $timeout, LoadingSpinnerService, $sce, __sfbEnv) {
      return {
        restrict: 'AE',
        replace: false,
        transclude: false,
        scope: true,
        require: '^sfSchema',
        link: {
          pre: function (scope, element, attrs, sfSchema) {
            // The ngModelController is used in some templates and
            // is needed for error messages,
            scope.$on('schemaFormPropagateNgModelController', function (event, ngModel) {
              event.stopPropagation();
              event.preventDefault();
              scope.ngModel = ngModel;
            });

            // Fetch our form.
            scope.form = sfSchema.lookup['f' + attrs.sfField] ? sfSchema.lookup['f' + attrs.sfField] : scope.form;
            
            var val = sfModelValue(scope);
            if((!scope.options || scope.options.setSchemaDefaults !== false) && scope.form.schema && scope.form.schema.default && angular.isUndefined(val)) {                
                sfModelValue(scope, scope.form.schema.default);
            }
          },
          post: function (scope, element, attrs, sfSchema) {
            // Keep error prone logic from the template
            scope.showTitle = function () {
              return scope.form && scope.form.notitle !== true && scope.form.title;
            };

            scope.listToCheckboxValues = function (list) {
              var values = {};
              angular.forEach(list, function (v) {
                values[v] = true;
              });
              return values;
            };

            scope.checkboxValuesToList = function (values) {
              var lst = [];
              angular.forEach(values, function (v, k) {
                if (v) {
                  lst.push(k);
                }
              });
              return lst;
            };

            scope.buttonClick = function ($event, form) {
              if (angular.isFunction(form.onClick)) {
                form.onClick($event, form);
              } else if (angular.isString(form.onClick)) {
                if (sfSchema) {
                  // evaluating in scope outside of sfSchemas isolated scope
                  sfSchema.evalInParentScope(form.onClick, {'$event': $event, form: form, model: scope.model});
                } else {
                  scope.$eval(form.onClick, {'$event': $event, form: form, model: scope.model});
                }
              }
            };

            /**
             * Evaluate an expression, i.e. scope.$eval
             * but do it in sfSchemas parent scope sf-schema directive is used
             * @param {string} expression
             * @param {Object} locals (optional)
             * @return {Any} the result of the expression
             */
            scope.evalExpr = function (expression, locals) {
              if (sfSchema) {
                // evaluating in scope outside of sfSchemas isolated scope
                return sfSchema.evalInParentScope(expression, locals);
              }

              return scope.$eval(expression, locals);
            };

            /**
             * Evaluate an expression, i.e. scope.$eval
             * in this decorators scope
             * @param {string} expression
             * @param {Object} locals (optional)
             * @return {Any} the result of the expression
             */
            scope.evalInScope = function (expression, locals) {
              if (expression) {
                return scope.$eval(expression, locals);
              }
            };

            /**
             * Interpolate the expression.
             * Similar to `evalExpr()` and `evalInScope()`
             * but will not fail if the expression is
             * text that contains spaces.
             *
             * Use the Angular `{{ interpolation }}`
             * braces to access properties on `locals`.
             *
             * @param  {string} content The string to interpolate.
             * @param  {Object} locals (optional) Properties that may be accessed in the
             *         `expression` string.
             * @return {Any} The result of the expression or `undefined`.
             */
            scope.interp = function (expression, locals) {
              return (expression && $interpolate(expression)(locals));
            };

            scope.modelValue = function (valueToSet) {
              // kelin: Some times the outside "scope" variable refers to a different
              // (seems scope.$parent) scope other than "this". So we override it
              // during this function call
              var scope = this;
              return sfModelValue(scope, valueToSet);
            };

            scope.interpArrayIndex = function (str) {
              var scope = this;
              return sfModelValue.interpArrayIndex(scope, str);
            };

            scope.getModelPath = function () {
              var scope = this;
              return sfModelValue.getModelPath(scope);
            };

            scope.trustAsHtml = function (str) {
              return $sce.trustAsHtml(str);
            };

            scope.encodeURIComponent = function (uriComponent) {
              if (uriComponent !== undefined && uriComponent !== null && uriComponent !== '') {
                return encodeURIComponent(uriComponent);
              }
              return '';
            };

            var utils = __sfbEnv && __sfbEnv.utils;
            if (!utils) {
              $log.error('sfField#postLink - \'utils\' property is missing from __sfbEnv. AngularJS expressions using \'utils\' will all fail. __sfbEnv is:', __sfbEnv);
            }
            scope.utils = utils;
            scope.env = __sfbEnv;

            // Angular tempaltes that have access to sf-field scope can use these pre-defined loading spinner
            // templates to cover a exact component in these templates:
            // 1. Use <div ng-show="form.httpPending" ng-bind-html="spinnerOverlaySmall|Middle|Large"></div>
            //    beside the exact component we want to cover.
            // 2. Use <div class="rds-spinner-container"></div> to enclose both the component and the overlay
            //    elements we just added.
            // Example: rds-dynamic-single-select.html
            scope.spinnerOverlayHtmlSmall = LoadingSpinnerService.spinnerOverlayHtmlSmall;
            scope.spinnerOverlayHtmlMiddle = LoadingSpinnerService.spinnerOverlayHtmlMiddle;
            scope.spinnerOverlayHtmlLarge = LoadingSpinnerService.spinnerOverlayHtmlLarge;

            // This works since we get the ngModel from the array or the schema-validate directive.
            scope.hasSuccess = function () {
              if (!scope.ngModel) {
                return false;
              }
              if (scope.options && scope.options.pristine &&
                                scope.options.pristine.success === false) {
                return scope.ngModel.$valid &&
                                    !scope.ngModel.$pristine && !_isEmptyNgModel();
              } else {
                return scope.ngModel.$valid &&
                                    (!scope.ngModel.$pristine || !_isEmptyNgModel());
              }
            };

            function _isEmptyNgModel () {
              var ngModel = scope.ngModel;
              var schema = scope.form.schema;
              return ngModel.$isEmpty(ngModel.$modelValue) ||
                ((schema && schema.type.indexOf('array') !== -1) && angular.equals(ngModel.$modelValue, []));
            }

            scope.hasError = function () {
              // console.log('sf-field - hasError() called');
              if (!scope.ngModel) {
                return false;
              }
              if (!scope.options || !scope.options.pristine || scope.options.pristine.errors !== false) {
                // Show errors in pristine forms. The default.
                // Note that "validateOnRender" option defaults to *not* validate initial form.
                // so as a default there won't be any error anyway, but if the model is modified
                // from the outside the error will show even if the field is pristine.
                return scope.ngModel.$invalid;
              } else {
                // Don't show errors in pristine forms.
                return scope.ngModel.$invalid && !scope.ngModel.$pristine;
              }
            };

            /**
             * DEPRECATED: use sf-messages instead.
             * Error message handler
             * An error can either be a schema validation message or a angular js validtion
             * error (i.e. required)
             */
            scope.errorMessage = function (schemaError) {
              return sfErrorMessage.interpolate(
                (schemaError && schemaError.code + '') || 'default',
                (scope.ngModel && scope.ngModel.$modelValue) || '',
                (scope.ngModel && scope.ngModel.$viewValue) || '',
                scope.form,
                scope.options && scope.options.validationMessage
              );
            };

            var form = scope.form;
            // Where there is a key there is probably a ngModel
            if (form.key) {
              // It looks better with dot notation.
              scope.$on('schemaForm.error.' + scope.getModelPath().join('.'),
                function (event, error, validationMessage, validity) {
                    // If jsExpression passed, we don't need to do anything.
                  if (error === 'jsExpression' &&
                      validity === true &&
                      !scope.ngModel.$error.jsExpression) {
                    return;
                  }

                    // If RemoteValidation passed, we don't need to do anything.
                  if (error === 'remoteValidation' &&
                      validity === true &&
                      !scope.ngModel.$error.remoteValidation) {
                    return;
                  }

                  if (scope.ngModel && error) {
                    if (scope.ngModel.$setDirty) {
                      scope.ngModel.$setDirty();
                    } else {
                      // FIXME: Check that this actually works on 1.2
                      scope.ngModel.$dirty = true;
                      scope.ngModel.$pristine = false;
                    }

                    // Set the new validation message if one is supplied
                    // Does not work when validationMessage is just a string.
                    if (validationMessage) {
                      if (!form.validationMessage) {
                        form.validationMessage = {};
                      } else if (typeof form.validationMessage === 'string') {
                        var defaultValidationMessage = form.validationMessage;
                        form.validationMessage = {};
                        form.validationMessage['202'] = defaultValidationMessage;
                      }
                      form.validationMessage[error] = validationMessage;
                    }

                    scope.ngModel.$setValidity(error, validity === true);

                    if (validity === true) {
                      // Re-trigger model validator, that model itself would be re-validated
                      scope.ngModel.$validate();

                      // Setting or removing a validity can change the field to believe its valid
                      // but its not. So lets trigger its validation as well.
                      scope.$broadcast('schemaFormValidate'); // kelin: this is just for the field itself.
                    }
                  }
                }
            );

              // Clean up the model when the corresponding form field is $destroy-ed.
              // Default behavior can be supplied as a globalOption, and behavior can be overridden
              // in the form definition.
              scope.$on('$destroy', function () {
                // If the entire schema form is destroyed we don't touch the model
                if (!scope.externalDestructionInProgress) {
                  var destroyStrategy = form.destroyStrategy ||
                    (scope.options && scope.options.destroyStrategy) || 'remove';
                  // No key no model, and we might have strategy 'retain'
                  var modelKey = scope.getModelPath();
                  if (modelKey && destroyStrategy !== 'retain') {
                    // Get the object that has the property we wan't to clear.
                    var obj = scope.model;
                    if (modelKey.length > 1) {
                      obj = sfSelect(modelKey.slice(0, modelKey.length - 1), obj);
                    }

                    // We can get undefined here if the form hasn't been filled out entirely
                    if (obj === undefined) {
                      return;
                    }

                    // Type can also be a list in JSON Schema
                    var type = (form.schema && form.schema.type) || '';

                    // Empty means '',{} and [] for appropriate types and undefined for the rest
                    // console.log('destroy', destroyStrategy, modelKey, type, obj);
                    if (destroyStrategy === 'empty' && type.indexOf('string') !== -1) {
                      obj[modelKey.slice(-1)] = '';
                    } else if (destroyStrategy === 'empty' && type.indexOf('object') !== -1) {
                      obj[modelKey.slice(-1)] = {};
                    } else if (destroyStrategy === 'empty' && type.indexOf('array') !== -1) {
                      obj[modelKey.slice(-1)] = [];
                    } else if (destroyStrategy === 'null') {
                      obj[modelKey.slice(-1)] = null;
                    } else {
                      delete obj[modelKey.slice(-1)];
                    }
                  }
                }
              });
            }

            if (form.derivedFrom) {
              // if value is derived, then it should not be editable, so set readonly. This is only display logic, so do not update schema
              form.readonly = true;
              
              var derivedFrom = form.derivedFrom;

              $log.debug('sfField#derivedFromPropertyHandler - ' + angular.toJson(form.key) + ' has derived-value expression: ' + derivedFrom);

              if (!scope.model) {
                $log.warn('sfField#derivedFromPropertyHandler - ' + angular.toJson(form.key) + ' is not associated with the form model, so won\'t do anything here');
              }

              var exp;
              try {
                exp = $parse(derivedFrom);
              } catch (e) {
                $log.error('sfField#derivedFromPropertyHandler - derived-value expression: ' + form.derivedFrom + ' is invalid');
                return;
              }

              $timeout(function () {
                var ngModel = scope.ngModel;

                if (!ngModel) {
                  $log.warn('sfField#derivedFromPropertyHandler - ' + angular.toJson(form.key) + ' is not associated with an ng-model, so won\'t do anything here');
                  return;
                }

                var modelPath = scope.getModelPath();

                scope.$watch(function () {
                  // The field itself should be excluded from the watched model object, to avoid the unnecessary second-time update
                  var modelToWatch = angular.copy(scope.model);
                  _.set(modelToWatch, modelPath, null);
                  return modelToWatch;
                }, function (modelNewVal, oldVal) {
                  if (angular.equals(modelNewVal, oldVal)) {
                    return;
                  }
                  $timeout(function () {
                    var result = exp({model: modelNewVal});
                    // ngModel.$setViewValue(result);
                    // ngModel.$commitViewValue();
                    scope.modelValue(result);
                    $log.debug('sfField#derivedFromPropertyHandler - updated ' + angular.toJson(form.key) + ' to ' + result + ' by derived-value expression: ' + derivedFrom);
                  });
                }, true);
                $log.debug('sfField#derivedFromPropertyHandler - watching model for updating ' + angular.toJson(form.key) + ' with derived-value expression: ' + derivedFrom);
              });
            }

            if (form.focusOnStart === true) {
              $timeout(function () {
                angular.element('input, select, textarea', element).first().focus();
              });
            }
          }
        }
      };
    }
  ]);
