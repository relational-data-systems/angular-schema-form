chai.should();

describe('sfValidator', function() {
  beforeEach(angular.mock.module('schemaForm'));

  var sfValidator;

  beforeEach(inject(function(
    _sfValidator_
  ) {
    sfValidator = _sfValidator_;
  }));

  it("Should validate an array value with some null or undefined properties correctly", function() {
    var form = {"key":["a1"],"type":"array","title":"Component Array","add":"Add","style":{"add":"btn-success"},"items":[{"key":["a1","","s2"],"title":"String Input","type":"text","placeholder":"","notitle":false,"readonly":false,"schema":{"required":false,"type":"string"},"ngModelOptions":{}}],"notitle":false,"readonly":false,"disableAdd":false,"schema":{"type":"array","items":{"type":"object","properties":{"s2":{"required":false,"type":"string"}}}},"ngModelOptions":{}};
    var value = [{"s2":null},{}];
    sfValidator.validate(form, value).valid.should.eq(true);

    form = {"type":"array","title":"Selected Results","add":"Add","style":{"add":"btn-success"},"items":[{"title":"ID","type":"number","placeholder":"","notitle":false,"readonly":true,"key":["search","","_source","ID"],"schema":{"required":false,"type":"integer"},"ngModelOptions":{}},{"title":"Date Picker","type":"date","tooltip":"","dateFormat":"DD/MM/YYYY","notitle":false,"defaultDate":"empty","readonly":false,"focusOnStart":false,"key":["search","","_source","LAST_CHANGED_TS"],"schema":{"type":"string","format":"date","required":false},"ngModelOptions":{}}],"notitle":false,"disableAdd":true,"key":["search"],"schema":{"type":"array","items":{"type":"object","properties":{"_source":{"type":"object","properties":{"ID":{"required":false,"type":"integer"},"LAST_CHANGED_TS":{"type":"string","format":"date","required":false}}}}}},"ngModelOptions":{}};
    value = [{"_index":"sailis","_type":"tenure","_id":"AVhLuo1ttJ5jk2DsAFHg","_score":2.3446412,"_source":{"ID":111718042,"ACTIVATION_TS":"0000-12-29T23:13:20.000+08:43:20","EXPIRY_TS":"9999-12-31T23:59:59.999+09:30","VOLUME_TYPE":undefined,"VOLUME_NO":4175,"FOLIO_NO":817,"ORDER_NO":1,"PAPER_YN":"N","MANUAL_YN":"Y","HOLDING_ID":603073,"CROWN_LEASE_ID":null,"AREA_M2":0,"AREA_TYPE":null,"PRE_SAILIS_YN":"N","VERSION":1,"LAST_CHANGED_BY":"MIGRATE","LAST_CHANGED_TS":"2015-04-25T11:57:45.260+09:30","LAST_CHANGED_ACTION":"M"}},{"_index":"sailis","_type":"tenure","_id":"AVhLuo1ttJ5jk2DsAFHi","_score":2.3446412,"_source":{"ID":111718044,"ACTIVATION_TS":"0000-12-29T23:13:20.000+08:43:20","EXPIRY_TS":"9999-12-31T23:59:59.999+09:30","VOLUME_TYPE":"CT","VOLUME_NO":4175,"FOLIO_NO":943,"ORDER_NO":1,"PAPER_YN":"N","MANUAL_YN":"Y","HOLDING_ID":603213,"CROWN_LEASE_ID":null,"AREA_M2":0,"AREA_TYPE":null,"PRE_SAILIS_YN":"N","VERSION":1,"LAST_CHANGED_BY":"MIGRATE","LAST_CHANGED_TS":"2015-04-25T11:57:45.260+09:30","LAST_CHANGED_ACTION":"M"}},{"_index":"sailis","_type":"tenure","_id":"AVhLuqGHtJ5jk2DsAFkB","_score":2.3446412,"_source":{"ID":111719867,"ACTIVATION_TS":"0000-12-29T23:13:20.000+08:43:20","EXPIRY_TS":"9999-12-31T23:59:59.999+09:30","VOLUME_TYPE":"CT","VOLUME_NO":810,"FOLIO_NO":177,"ORDER_NO":1,"PAPER_YN":"N","MANUAL_YN":"Y","HOLDING_ID":723054,"CROWN_LEASE_ID":null,"AREA_M2":0,"AREA_TYPE":null,"PRE_SAILIS_YN":"N","VERSION":1,"LAST_CHANGED_BY":"MIGRATE","LAST_CHANGED_TS":"2015-04-25T11:57:45.260+09:30","LAST_CHANGED_ACTION":"M"}}];
    sfValidator.validate(form, value).valid.should.eq(true);
  })

});