/**
 * Created by Luke on 31/08/2016.
 */
angular.module('schemaForm').directive('jsExpression', [function() {

        return {
            restrict: 'A',
            scope: false,
            // We want the link function to be *after* the input directives link function so we get access
            // the parsed value, ex. a number instead of a string
            priority: 500,
            require: '?ngModel',
            link: function ($scope, $element, $attr, ngModel, $transclude) {
                var form = $scope.form;
                var schema = form.schema;

                $scope.$watch($attr.jsExpression, function(isValid) {
                    $scope.form.jsExpressionResult = isValid;
                    if (isFormDirty()) {
                        $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'jsExpression', isValid);
                    }
                });

                function isFormDirty() {
                    //FIXME, check till root form
                    var result = $scope.ngModel.$$parentForm.$dirty;
                    if (!result && $scope.ngModel.$$parentForm.$$parentForm) {
                        result = $scope.ngModel.$$parentForm.$$parentForm.$dirty;
                    }
                }
            }
        };
    }]);
