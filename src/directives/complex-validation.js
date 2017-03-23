/**
 * Created by Luke on 31/08/2016.
 */
angular.module('schemaForm').directive('jsExpression', ['sfValidator', '$parse', 'sfSelect',
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

                var form = $scope.form;
                var schema = form.schema;

                // New version
                // jsExpression: string
                // errorMessage: {
                //     jsExpression: string
                // }

                if (schema.jsExpression) {
                    if (schema.errorMessage && schema.errorMessage.jsExpression) {
                        if (!form.validationMessage) {
                            form.validationMessage = {};
                        } else if (typeof form.validationMessage === "string") {
                            var defaultValidationMessage = form.validationMessage;
                            $scope.form.validationMessage = {};
                            $scope.form.validationMessage["202"] = defaultValidationMessage;
                        }
                        form.validationMessage['jsExpression'] = schema.errorMessage.jsExpression;
                    }
                }

                $scope.$watch($attr.jsExpression, function watchAction(value) {

                    if (value) {
                        //console.log('schemaForm.error.' + $scope.form.key.join('.') + "  complexValidation  valid");
                        $scope.form.jsExpressionResult = true;
                        if ($scope.ngModel.$$parentForm.$dirty)
                            $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'jsExpression', true);
                    } else {
                        //console.log('schemaForm.error.' + $scope.form.key.join('.') + "  complexValidation  invalid");
                        $scope.form.jsExpressionResult = false;

                        //FIXME, check till root form
                        var isFormDirty = $scope.ngModel.$$parentForm.$dirty;
                        if (!isFormDirty && $scope.ngModel.$$parentForm.$$parentForm)
                            isFormDirty = $scope.ngModel.$$parentForm.$$parentForm.$dirty;

                        if (isFormDirty)
                            $scope.$broadcast('schemaForm.error.' + $scope.form.key.join('.'), 'jsExpression');
                    }
                });
            }
        };
    }]);
