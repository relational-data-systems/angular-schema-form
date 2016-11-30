(function() {
  'use strict';

  angular
    .module('schemaForm')
    .factory('sfModelValue', sfModelValue);

  sfModelValue.$inject = ['sfPath', '$rootScope', 'sfSelect'];

  /* @ngInject */
  function sfModelValue(sfPath, $rootScope, sfSelect) {

    return function(param1, param2, param3, param4) {
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
        _assertValidateSfScope(scope);
        projection = scope.form.key;
        obj = scope.model;
      } else if (param2 !== undefined && param3 === undefined && param4 === undefined) {
        _assertValidateSfScope(scope);
        projection = scope.form.key;
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

      var parts = typeof projection === 'string' ? sfPath.parse(projection) : angular.copy(projection);
      var currentScope = scope;
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] === '') {
          var scopeArrayIndex = _findArrayIndexFromScope();
          if (angular.isNumber(scopeArrayIndex)) {
            parts[i] = scopeArrayIndex;
          } else {
            $log.error("sfModelValue - Cannot find array index with the given scope", scope, parts);
          }
        }
      }
      return sfSelect(parts, obj, valueToSet);

      function _isScope(candidate) {
        return candidate instanceof $rootScope.constructor;
      }

      function _findArrayIndexFromScope() {
        var result = currentScope.$index;
        while (!angular.isNumber(result) && currentScope !== $rootScope) {
          currentScope = currentScope.$parent;
        }
        return result;
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
    }
  }
})();