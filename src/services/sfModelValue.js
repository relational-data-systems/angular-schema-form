(function() {
  'use strict';

  angular
    .module('schemaForm')
    .factory('sfModelValue', sfModelValue);

  sfModelValue.$inject = ['sfPath', '$rootScope', 'sfSelect', '$log'];

  /* @ngInject */
  function sfModelValue(sfPath, $rootScope, sfSelect, $log) {
    service.getModelPath = getModelPath;
    service.interpArrayIndex = interpArrayIndex;
    return service;

    function service(param1, param2, param3, param4) {
      var scope, projection, obj, valueToSet;

      if (!(_isScope(param1))) {
        // If the first param is not a scope, just delegate to sfSelect
        projection = param1;
        obj = param2;
        valueToSet = param3;
        return sfSelect(projection, obj, valueToSet);
      }

      // If we arrive here, the first param is a Scope. We can try to get/set model values
      // if the projection and obj is not specified by the user.
      scope = param1;
      if (param2 === undefined && param3 === undefined && param4 === undefined) {
        projection = getModelPath(scope);
        obj = scope.model;
      } else if (param2 !== undefined && param3 === undefined && param4 === undefined) {
        projection = getModelPath(scope);
        obj = scope.model;
        valueToSet = param2;
      } else if (param2 !== undefined && param3 !== undefined && param4 === undefined) {
        projection = param2;
        obj = param3;
      } else if (param2 !== undefined && param3 !== undefined && param4 !== undefined) {
        projection = param2;
        obj = param3;
        valueToSet = param4;
      } else {
        $log.error("sfModelValue - incorrect param combination: ", param1, param2, param3, param4);
        throw Error("sfModelValue - incorrect param combination");
      }

      return sfSelect(projection, obj, valueToSet);
    }

    function getModelPath(scope) {
      var modelPath;

      if (!scope.form) {
        return null;
      }
      _assertValidateSfScope(scope);
      var arrayIndices = _getArrayIndicesByScopeHierarchy(scope);
      if (scope.form.key) {
        modelPath = angular.copy(scope.form.key);
        _updateModelPathWithArrayIndices(modelPath, arrayIndices);
        return modelPath;
      } else {
        if (arrayIndices.length > 0) { // This means that we are inside an array
          var parentArrayComponentKey = _findParentArrayComponentKey(scope);
          if (!parentArrayComponentKey) {
            $log.error("sfModelValue#getModelPath - failed to find an array that contains this component: ", form);
            return null;
          }
          modelPath = angular.copy(parentArrayComponentKey);
          modelPath.push("");
          _updateModelPathWithArrayIndices(modelPath, arrayIndices);
          return modelPath;
        } else {
          return null;
        }
      }
    }

    function _findParentArrayComponentKey(scope) {
      var result = null;
      var currentScope;
      while ((currentScope = scope.$parent) != null) {
        var form = currentScope.form;
        if (form && form.schema && form.schema.type === 'array') {
          result = form.key;
          break;
        }
      }
      return result;
    }

    function _updateModelPathWithArrayIndices(modelPath, arrayIndices) {
      for (var i = modelPath.length - 1; i >= 0; i--) {
        if (modelPath[i] === '') {
          if (arrayIndices.length > 0) {
            var scopeArrayIndex = arrayIndices.splice(-1, 1)[0];
            modelPath[i] = scopeArrayIndex;
          } else {
            $log.error("sfModelValue#_updateModelPathWithArrayIndices - Cannot find any more array index for the model path", arrayIndices, modelPath);
          }
        }
      }
      if (arrayIndices.length !== 0) {
        $log.error("sfModelValue#_updateModelPathWithArrayIndices - array indices found along the scope hierarcy does not match to model path", arrayIndices, modelPath);
      }
    }

    function interpArrayIndex(scope, /*"array[].item" or ["array", "", "item"]*/ strOrArray) {
      _assertValidateSfScope(scope);
      var arrayIndices = _getArrayIndicesByScopeHierarchy(scope);
      if (angular.isString(strOrArray)) {
        var str = strOrArray;
        var regex = /(\[\])+/g;
        var matched;
        while ((matched = regex.exec(str)) !== null) {
            var replaceCount = matched[0].length / 2;
            for (var i = 0; i < replaceCount; i++) {
                if (i < arrayIndices.length) {
                    str = str.replace(/\[\]/, "[" + arrayIndices[i] + "]");
                } else {
                    $log.error("sfModelValue#interpArrayIndex - Cannot find any more array index for the current match", arrayIndices, matched);
                }
            }
        }
        return str;
      } else if (angular.isArray(strOrArray)) {
        var arr = angular.copy(strOrArray);
        _updateModelPathWithArrayIndices(arr, arrayIndices);
        return arr;
      }

    }

    function _isScope(candidate) {
      return candidate instanceof $rootScope.constructor;
    }

    function _assertValidateSfScope(scope) {
      if (!_isScope(scope)) {
        throw scope + " is not a scope";
      }

      if (!scope.form) {
        throw scope + " does not have a form object";
      }
    }

    function _getArrayIndicesByScopeHierarchy(scope) {
      var result = [];
      var currentScope = scope;
      while (currentScope) {
        var index = null;
        // Add an extra override to first check for $gridIndex. Support required for data grid
        if (currentScope.hasOwnProperty('$gridRowIndex')) {
          index = currentScope.$gridRowIndex;
        }
        else if (currentScope.hasOwnProperty('$index')) {
            index = currentScope.$index;
        }
        if (angular.isNumber(index)) {
          result.unshift(index);
          currentScope = currentScope.$parent; // Skip one more level out of the ng-repeat
        }
        currentScope = currentScope.$parent;
      }
      return result;
    }

  }
})();