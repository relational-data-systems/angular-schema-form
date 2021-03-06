/*  Common code for validating a value against its form and schema definition */
/* global tv4 */
angular.module('schemaForm').factory('sfValidator', [function () {
  var validator = {};

  function recResetNullValues (obj) {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        var propValue = obj[property];
        if (propValue === null || propValue === undefined) {
          delete obj[property];
        } else if (typeof propValue === 'object') {
          recResetNullValues(obj[property], property);
        } else {
          if (obj[property] === null) {
          }
        }
      }
    }
  }

  /**
   * Validate a value against its form definition and schema.
   * The value should either be of proper type or a string, some type
   * coercion is applied.
   *
   * @param {Object} form A merged form definition, i.e. one with a schema.
   * @param {Any} value the value to validate.
   * @return a tv4js result object.
   */
  validator.validate = function (form, value) {
    if (!form) {
      return {valid: true};
    }
    var schema = form.schema;

    if (!schema) {
      return {valid: true};
    }

    // Input of type text and textareas will give us a viewValue of ''
    // when empty, this is a valid value in a schema and does not count as something
    // that breaks validation of 'required'. But for our own sanity an empty field should
    // not validate if it's required.
    if (value === '') {
      value = undefined;
    }

    if (form.type === 'array') {
      // A null or undefined in an array, or in its nested child at any level would cause
      // the validation to fail. So we will simple remove the properties with these values
      value = angular.copy(value);
      recResetNullValues(value);

      // Skip the validation for the content of array child items, i.e., only validate the
      // array itself
      schema = angular.copy(form.schema);
      delete schema.items;
    }

    // Numbers fields will give a null value, which also means empty field
    if (form.type === 'number' && value === null) {
      value = undefined;
    }

    // kelin: we want text, date fields to be as above as well
    if (['', 'text', 'textarea', 'date'].indexOf(form.type) !== -1) {
      if (value === null) {
        value = undefined;
      }
    }

    // kelin - our own workaround for null value being rejected in select components
    // due to typeof(null) === 'object'
    if (['select', 'rds-dynamic-single-select', 'rds-dynamic-radios', 'radios-inline', 'radiobuttons'].indexOf(form.type) !== -1) {
      if (value === null) {
        value = undefined;
      }
    }

    if (['rds-multi-select', 'rds-dynamic-multi-select', 'checkboxes', 'rds-dynamic-checkboxes']) {
      if (angular.equals(value, [])) {
        value = undefined;
      }
    }

    // Version 4 of JSON Schema has the required property not on the
    // property itself but on the wrapping object. Since we like to test
    // only this property we wrap it in a fake object.
    var wrap = {type: 'object', 'properties': {}};
    var propName = form.key[form.key.length - 1];
    wrap.properties[propName] = schema;

    if (form.required) {
      wrap.required = [propName];
    }
    var valueWrap = {};
    if (angular.isDefined(value)) {
      valueWrap[propName] = value;
    }
    return tv4.validateResult(valueWrap, wrap);
  };

  return validator;
}]);
