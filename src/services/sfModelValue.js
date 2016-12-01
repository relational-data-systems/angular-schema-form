(function() {
  'use strict';

  angular
    .module('schemaForm')
    .factory('sfModelValue', sfModelValue);

  sfModelValue.$inject = ['sfPath', '$rootScope', 'sfSelect', '$log'];

  /* @ngInject */
  function sfModelValue(sfPath, $rootScope, sfSelect, $log) {
    service.getSfModelPath = getSfModelPath;
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
        projection = getSfModelPath(scope);
        obj = scope.model;
      } else if (param2 !== undefined && param3 === undefined && param4 === undefined) {
        projection = getSfModelPath(scope);
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

    function getSfModelPath(scope) {
      if (!scope.form || !scope.form.key || !scope.model) {
        return null;
      }
      _assertValidateSfScope(scope);
      var arrayIndices = _getArrayIndicesByScopeHierarchy(scope);
      var modelPath = angular.copy(scope.form.key);
      for (var i = modelPath.length - 1; i >= 0; i--) {
        if (modelPath[i] === '') {
          if (arrayIndices.length > 0) {
            var scopeArrayIndex = arrayIndices.splice(-1, 1)[0];
            modelPath[i] = scopeArrayIndex;
          } else {
            $log.error("sfModelValue#getSfModelPath - Cannot find any more array index for the model path", arrayIndices, modelPath);
          }
        } 
      }
      if (arrayIndices.length !== 0) {
        $log.error("sfModelValue#getSfModelPath - array indices found along the scope hierarcy does not match to model path", arrayIndices, modelPath);
      }
      return modelPath;
    }

    function interpArrayIndex(scope, str) {
      _assertValidateSfScope(scope);
      var arrayIndices = _getArrayIndicesByScopeHierarchy(scope);
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

      if (!scope.form.key) {
        throw scope + " does not have a form key";
      }

      if (!scope.model) {
        throw "there is no model in this scope";
      }
    }

    function _getArrayIndicesByScopeHierarchy(scope) {
      var result = [];
      var currentScope = scope;
      while (currentScope) {
        var index = currentScope.$index;
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