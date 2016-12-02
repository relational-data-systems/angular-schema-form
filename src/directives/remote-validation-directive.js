(function() {
  'use strict';

  angular.module('schemaForm').directive('remoteValidation', remoteValidation);

  remoteValidation.$inject = ['$log', '$interpolate', '$http', '$compile'];

  function remoteValidation($log, $interpolate, $http, $compile) {
    var directive = {
      restrict: 'A',
      scope: false,
      priority: 500,
      require: '^ngModel',
      link: link
    };
    return directive;

    function link($scope, element, attrs, ctrl) {

      // FIXME: make the directive not render at all if not in use.
      if (!$scope.form.remoteValidation){
        return;
      }

      var form = $scope.form;
      var model = $scope.model;

      _setupErrorMsgs();
      _watchInput();

      function _watchInput() {
        // append model and double braces pre-interpolation eg; {{model.}} to all watched model items
        var regex_interpolate = /({)([^}]*)(})/gm;
        var _validationTemplateUrl = form.remoteValidation.replace(regex_interpolate, '$1$1 model.$2 $3$3');

        var reqex_source = /{{([^}]*)}}/gm;

        // when values are equal no replacement was made and hence no model attributes matched
        if (_validationTemplateUrl === form.remoteValidation) {
          // when there are no dependent fields, validate when the fields model value changes
          $scope.$watch("model." + form.key.join('.'), function(newValue, oldValue) {
            if (newValue) {
              var exp = $interpolate(_validationTemplateUrl, false, null, true);
              var interpolatedUrl = exp($scope);
              _validate(interpolatedUrl);
            }
          });
        }else {
          // add a watch event to revalidate when any dependent model value changes
          var matched;
          while ((matched = reqex_source.exec(_validationTemplateUrl)) !== null) {
            $scope.$watch(matched[1], function(newValue, oldValue) {
              if (newValue) {
                // FIXME: interpolate does not handle undefined values very well, model attributes should be checked and
                // substituted for an empty string. This works for now, will update this soon. -- Chris W
                var exp = $interpolate(_validationTemplateUrl, false, null, true);
                var interpolatedUrl = exp($scope);
                _validate(interpolatedUrl);
              }
            });
          }
        }
      }

      function _validate(interpolatedUrl) {
        //console.log('HTTPO req -- ', interpolatedUrl);
        $http({
          method: 'GET',
          url: interpolatedUrl
        }).then(function(response) {
          // expects a JSON object with a single boolean as a response.
          var result = response.data.validation;
          _broadcastErrorMsgs(result);
        }).catch(function(response) {
          // TODO: Do nothing for now. Should display message such as 'HTTP Error: Unable to validate data'
        });
      }

      // setup validation messages as an array
      function _setupErrorMsgs(){
        if ($scope.form.remoteValidationMessage) {
            if (!$scope.form.validationMessage) {
                $scope.form.validationMessage = {};
            } else if (typeof $scope.form.validationMessage === "string") {
                // take validationMessage and shoehorn it into a new array of messages
                var defaultValidationMessage = $scope.form.validationMessage;
                $scope.form.validationMessage = {};
                $scope.form.validationMessage["202"] = defaultValidationMessage;
            }
            $scope.form.validationMessage['remoteValidation'] = $scope.form.remoteValidationMessage;
        }
      }

      // broadcast validation errors
      function _broadcastErrorMsgs(result){
        if (result) {
            $scope.form.remoteValidationResult = true;
            if ($scope.ngModel.$$parentForm.$dirty)
                $scope.$root.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'remoteValidation', true);
        } else {
            $scope.form.remoteValidationResult = false;
            //FIXME: copied from complex-validation.js does not check til root of document
            var isFormDirty = $scope.ngModel.$$parentForm.$dirty
            if (!isFormDirty && $scope.ngModel.$$parentForm.$$parentForm){
                isFormDirty = $scope.ngModel.$$parentForm.$$parentForm.$dirty;
            }
            if (isFormDirty){
                $scope.$root.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'remoteValidation', false);
            }
        }
      }
    }
  }

})();
