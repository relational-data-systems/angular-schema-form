/**
 * Created by Luke on 31/08/2016.
 */
angular.module('schemaForm').directive('complexValidation', ['sfValidator', '$parse', 'sfSelect',
    function (sfValidator, $parse, sfSelect) {

        return {
            restrict: 'A',
            scope: false,
            // We want the link function to be *after* the input directives link function so we get access
            // the parsed value, ex. a number instead of a string
            priority: 500,
            require: '?ngModel',
            link: function ($scope, $element, $attr, ngModel, $transclude) {
                var block, childScope, previousElements;

                if ($scope.form.complexValidationMessage) {
                    if (!$scope.form.validationMessage) {
                        $scope.form.validationMessage = {};
                    } else if (typeof $scope.form.validationMessage === "string") {
                        var defaultValidationMessage = $scope.form.validationMessage;
                        $scope.form.validationMessage = {};
                        $scope.form.validationMessage["202"] = defaultValidationMessage;
                    }
                    $scope.form.validationMessage['complexValidation'] = $scope.form.complexValidationMessage;
                }

                $scope.$watch($attr.complexValidation, function watchAction(value) {

                    if (value) {
                        //console.log('schemaForm.error.' + $scope.form.key.join('.') + "  complexValidation  valid");
                        $scope.form.complexValidationResult = true;
                        if ($scope.ngModel.$$parentForm.$dirty)
                            $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'complexValidation', true);
                    } else {
                        //console.log('schemaForm.error.' + $scope.form.key.join('.') + "  complexValidation  invalid");
                        $scope.form.complexValidationResult = false;

                        //FIXME, check till root form
                        var isFormDirty = $scope.ngModel.$$parentForm.$dirty
                        if (!isFormDirty && $scope.ngModel.$$parentForm.$$parentForm)
                            isFormDirty = $scope.ngModel.$$parentForm.$$parentForm.$dirty;

                        if (isFormDirty)
                            $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'complexValidation');
                    }
                });
            }
        };
    }]);
