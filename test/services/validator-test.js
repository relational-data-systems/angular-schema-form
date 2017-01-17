chai.should();

describe('sfValidator', function() {
  beforeEach(angular.mock.module('schemaForm'));

  var sfValidator;

  beforeEach(inject(function(
    _sfValidator_
  ) {
    sfValidator = _sfValidator_;
  }));

  it("Should validate an array value correctly", function() {
    var form = {"key":["a1"],"type":"array","title":"Component Array","add":"Add","style":{"add":"btn-success"},"items":[{"key":["a1","","s2"],"title":"String Input","type":"text","placeholder":"","notitle":false,"readonly":false,"schema":{"required":false,"type":"string"},"ngModelOptions":{}}],"notitle":false,"readonly":false,"disableAdd":false,"schema":{"type":"array","items":{"type":"object","properties":{"s2":{"required":false,"type":"string"}}}},"ngModelOptions":{}};
    var value = [{"s2":null},{}];
    sfValidator.validate(form, value).should.eq(true);
  })

});