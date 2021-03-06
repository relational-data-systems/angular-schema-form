/**
 * Directive that handles the model arrays
 */
angular.module('schemaForm').directive('sfNewArray', ['$sce', 'sfSelect', 'sfPath', 'schemaForm', '$timeout', '$log',
  function ($sce, sel, sfPath, schemaForm, $timeout, $log) {
    return {
      scope: false,
      link: function (scope, element, attrs) {
        scope.min = 0;

        scope.modelArray = scope.$eval(attrs.sfNewArray);

        if (scope.form && scope.form.htmlWhenEmptyTemplate) {
          scope.htmlWhenEmpty = $sce.trustAsHtml(scope.form.htmlWhenEmptyTemplate);
        }

      // We need to have a ngModel to hook into validation. It doesn't really play well with
      // arrays though so we both need to trigger validation and onChange.
      // So we watch the value as well. But watching an array can be tricky. We wan't to know
      // when it changes so we can validate,
        var watchFn = function () {
          // scope.modelArray = modelArray;
          scope.modelArray = scope.$eval(attrs.sfNewArray);
          // validateField method is exported by schema-validate
          if (scope.ngModel && scope.ngModel.$pristine && scope.firstDigest &&
            (!scope.options || scope.options.validateOnRender !== true)) {

          } else if (scope.validateField) {
            scope.validateField();
          }
        };

        var onChangeFn = function () {
          if (scope.form && scope.form.onChange) {
            if (angular.isFunction(scope.form.onChange)) {
              scope.form.onChange(scope.modelArray, scope.form);
            } else {
              scope.evalExpr(scope.form.onChange, {'modelValue': scope.modelArray, form: scope.form});
            }
          }
        };

      // If model is undefined make sure it gets set.
        var getOrCreateModel = function () {
          var model = scope.modelArray;
          if (!model) {
            var selection = sfPath.parse(attrs.sfNewArray);
            model = [];
            sel(selection, scope, model);
            scope.modelArray = model;
          }
          return model;
        };

        // We need the form definition to make a decision on how we should listen.
        var once = scope.$watch('form', function (form) {
          if (!form) {
            return;
          }

          // Always start with one empty form unless configured otherwise.
          // Special case: don't do it if form has a titleMap
          if (!form.titleMap && form.startEmpty && form.readonly !== true && (!scope.modelArray || scope.modelArray.length === 0)) {
            scope.appendToArray();
          }

          // If we have "uniqueItems" set to true, we must deep watch for changes.
          if (scope.form && scope.form.schema && scope.form.schema.uniqueItems === true) {
            scope.$watch(attrs.sfNewArray, watchFn, true);

            // We still need to trigger onChange though.
            scope.$watch([attrs.sfNewArray, attrs.sfNewArray + '.length'], onChangeFn);
          } else {
            // Otherwise we like to check if the instance of the array has changed, or if something
            // has been added/removed.
            if (scope.$watchGroup) {
              scope.$watchGroup([attrs.sfNewArray, attrs.sfNewArray + '.length'], function () {
                watchFn();
                onChangeFn();
              });
            } else {
              // Angular 1.2 support
              scope.$watch(attrs.sfNewArray, function () {
                watchFn();
                onChangeFn();
              });
              scope.$watch(attrs.sfNewArray + '.length', function () {
                watchFn();
                onChangeFn();
              });
            }
          }

          // Title Map handling
          // If form has a titleMap configured we'd like to enable looping over
          // titleMap instead of modelArray, this is used for intance in
          // checkboxes. So instead of variable number of things we like to create
          // a array value from a subset of values in the titleMap.
          // The problem here is that ng-model on a checkbox doesn't really map to
          // a list of values. This is here to fix that.
          if (form.titleMap && form.titleMap.length > 0) {
            scope.titleMapValues = [];

            // We watch the model for changes and the titleMapValues to reflect
            // the modelArray
            var updateTitleMapValues = function (arr) {
              scope.titleMapValues = [];
              arr = arr || [];

              form.titleMap.forEach(function (item) {
                scope.titleMapValues.push(arr.indexOf(item.value) !== -1);
              });
            };
            // Catch default values
            updateTitleMapValues(scope.modelArray);

            // TODO: Refactor and see if we can get rid of this watch by piggy backing on the
            // validation watch.
            scope.$watchCollection('modelArray', updateTitleMapValues);

            // To get two way binding we also watch our titleMapValues
            scope.$watchCollection('titleMapValues', function (vals, old) {
              if (vals && vals !== old) {
                var arr = getOrCreateModel();

                form.titleMap.forEach(function (item, index) {
                  var arrIndex = arr.indexOf(item.value);
                  if (arrIndex === -1 && vals[index]) { arr.push(item.value); }
                  if (arrIndex !== -1 && !vals[index]) { arr.splice(arrIndex, 1); }
                });

                // Time to validate the rebuilt array.
                // validateField method is exported by schema-validate
                if (scope.validateField) {
                  // kelin: postpone the validation after data are updated to model to avoid
                  // giving incorrect validation result.
                  $timeout(scope.validateField);
                }
              }
            });
          }

          once();
        });

        scope.appendToArray = function () {
          var shouldShowAsUsedWithSubmodelAPI = scope.evalInScope("model._uiCtrlExtra.shouldEnableSubModelApiButtons");
          if(shouldShowAsUsedWithSubmodelAPI && scope.form.readonly && scope.form.formIdForSubModelApi) {
            openFormForSubModelAPI();
          } else {
            var empty;

            // Create and set an array if needed.
            var model = getOrCreateModel();

            // Same old add empty things to the array hack :(
            if (scope.form && scope.form.schema && scope.form.schema.items) {
              var items = scope.form.schema.items;
              if (items.type && items.type.indexOf('object') !== -1) {
                empty = {};

                // Check for possible defaults
                if (!scope.options || scope.options.setSchemaDefaults !== false) {
                  empty = angular.isDefined(items['default']) ? items['default'] : empty;

                  // Check for defaults further down in the schema.
                  // If the default instance sets the new array item to something falsy, i.e. null
                  // then there is no need to go further down.
                  if (empty) {
                    schemaForm.traverseSchema(items, function (prop, path) {
                      if (angular.isDefined(prop['default'])) {
                        sel(path, empty, prop['default']);
                      }
                    });
                  }
                }
              } else if (items.type && items.type.indexOf('array') !== -1) {
                empty = [];
                if (!scope.options || scope.options.setSchemaDefaults !== false) {
                  empty = items['default'] || empty;
                }
              } else {
                // No type? could still have defaults.
                if (!scope.options || scope.options.setSchemaDefaults !== false) {
                  empty = items['default'] || empty;
                }
              }
            }
            model.push(empty);

            return model;
          }
        };

        scope.deleteFromArray = function (index) {
          var model = scope.modelArray;
          if (model) {
            model.splice(index, 1);
          }
          return model;
        };

        scope.indexDown = function (index) {
          var model = scope.modelArray;
          if (model && index > 0 && index < model.length) {
            var tmp = model[index - 1];
            model[index - 1] = model[index];
            model[index] = tmp;
            return index - 1;
          } else {
            return index;
          }
        };

        scope.indexUp = function (index) {
          var model = scope.modelArray;
          if (model && index >= 0 && index < model.length - 1) {
            var tmp = model[index + 1];
            model[index + 1] = model[index];
            model[index] = tmp;
            return index + 1;
          } else {
            return index;
          }
        };

        // For backwards compatability, i.e. when a bootstrap-decorator tag is used
        // as child to the array.
        var setIndex = function (index) {
          return function (form) {
            if (form.key) {
              form.key[form.key.indexOf('')] = index;
            }
          };
        };
        var formDefCache = {};
        scope.copyWithIndex = function (index) {
          var form = scope.form;
          if (!formDefCache[index]) {
            // To be more compatible with JSON Form we support an array of items
            // in the form definition of "array" (the schema just a value).
            // for the subforms code to work this means we wrap everything in a
            // section. Unless there is just one.
            var subForm = form.items[0];
            if (form.items.length > 1) {
              subForm = {
                type: 'section',
                items: form.items.map(function (item) {
                  item.ngModelOptions = form.ngModelOptions;
                  if (angular.isUndefined(item.readonly)) {
                    item.readonly = form.readonly;
                  }
                  return item;
                })
              };
            }

            if (subForm) {
              var copy = angular.copy(subForm);
              copy.arrayIndex = index;
              schemaForm.traverseForm(copy, setIndex(index));
              formDefCache[index] = copy;
            }
          }
          return formDefCache[index];
        };
        
        //To reuse the "add" button of array component with submodel api, we have to put our contrl logic into this angular schmea form array code, not a good thing to do, but have to?
        scope.shouldShowAsUsedWithSubmodelAPI = function() {          
          return scope.evalInScope("model._uiCtrlExtra.shouldEnableSubModelApiButtons") && !scope.form.disableAdd && scope.form.formIdForSubModelApi;
        };
        
        function openFormForSubModelAPI() {
          var pathArray = scope.getModelPath();
          var path = '';
          if(pathArray) {
           pathArray.forEach( function(subpath) {
             if(Number.isInteger(subpath)) {
               path += '.[' + subpath + ']';
             } else {
               path += '.' + subpath;
             }
           });
          }
          if(path) {
            path = path.substr(1);
          }
          
          var model = getOrCreateModel();
          path += ".[" + model.length + "]";
          
          var pId = scope.evalInScope("model._processInstanceId");
          var taskId = scope.evalInScope("model._taskId");
          var formkey = scope.form.formIdForSubModelApi;
          var url = __sfbEnv.baseUrl + 'data/';
          if(taskId) {
            url += 'tid/' + taskId + '?path=' + encodeURIComponent(path) + '&form=' + encodeURIComponent(formkey) ; 
          } else {
            url += 'pid/' + pId + '?path=' + encodeURIComponent(path) + '&form=' + encodeURIComponent(formkey) ; 
          }
          
          getRootController(scope).openFormInDialog(formkey, url);
        }
        
        function getRootController (scope) {
          var controller = scope.evalExpr('$$ctrl$$');
          if (!controller) {
            return null;
          }

          if (!controller.openFormInDialog || !angular.isFunction(controller.openFormInDialog)) {
            controller.openFormInDialog = _simpleMockFunction();
          }
          return controller;
        }

        function _simpleMockFunction () {
          return function () {
            $log.debug('Mock function ' + arguments.callee + ' is called, arguments: ', arguments);
          };
        }
        
      }
      
    };
  }]);
