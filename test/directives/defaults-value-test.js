chai.should();

describe('directive', function () {
  beforeEach(module('schemaForm'));
  beforeEach(
    // We don't need no sanitation. We don't need no thought control.
    module(function ($sceProvider, $provide) {
      $sceProvider.enabled(false);
      
      $provide.constant('__sfbEnv', {});
    })
  );

  var exampleSchema = {
    'type': 'object',
    'properties': {
      'name': {
        'title': 'Name',
        'description': 'Gimme yea name lad',
        'type': 'string'
      },
      'gender': {
        'title': 'Choose:',
        'type': 'string',
        'enum': [
          'undefined',
          'null',
          'NaN'
        ]
      }
    }
  };

  

  it('should honor defaults in schema', function () {
     
     
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {
        name: 'Foobar'
      };

      scope.schema = {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'default': 'Bar'
          },
          'nick': {
            'type': 'string',
            'default': 'Zeb'
          },
          'alias': {
            'type': 'string'
          }
        }
      };

      scope.form = ['*'];

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();

      scope.person.name.should.be.equal('Foobar');
      scope.person.nick.should.be.equal('Zeb');
      expect(scope.person.alias).to.be.undefined;
    });
  });

  it('should honor defaults in schema unless told not to', function () {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {
        name: 'Foobar'
      };

      scope.schema = {
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
            'default': 'Bar'
          },
          'nick': {
            'type': 'string',
            'default': 'Zeb'
          },
          'alias': {
            'type': 'string'
          }
        }
      };

      scope.form = ['*'];

      scope.options = {setSchemaDefaults: false};

      var tmpl = angular.element('<form sf-options="options" sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();

      scope.person.name.should.be.equal('Foobar');
      expect(scope.person.nick).to.be.undefined;
      expect(scope.person.alias).to.be.undefined;
    });
  });

  it('should handle schema form default in deep structure', function () {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {
        name: 'Foobar'
      };

      scope.schema = {
        'type': 'object',
        'properties': {
          'props': {
            'type': 'object',
            'title': 'Person',
            'properties': {
              'name': {
                'type': 'string',
                'default': 'Name'
              },
              'nick': {
                'type': 'string',
                'default': 'Nick'
              },
              'alias': {
                'type': 'string'
              }
            }
          }
        }
      };

      // The form defines a fieldset for person, and changes the order of fields
      // but titles should come from the schema
      scope.form = [{
        type: 'fieldset',
        key: 'props',
        items: [
          'props.nick',
          'props.name',
          'props.alias'
        ]
      }];

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();

      scope.person.props.name.should.be.equal('Name');
      scope.person.props.nick.should.be.equal('Nick');
      expect(scope.person.props.alias).to.be.undefined;
    });
  });
   
  
  it('should handle schema form default in deep structure with array', function () {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {
        'arr': [{}]
      };

      scope.schema = {
        'type': 'object',
        'properties': {
          'arr': {
            'type': 'array',
            'items': {
              'type': 'object',
              'title': 'Person',
              'properties': {
                'name': {
                  'type': 'string',
                  'default': 'Name'
                },
                'nick': {
                  'type': 'string',
                  'default': 'Nick'
                },
                'alias': {
                  'type': 'string'
                }
              }
            }
          }
        }
      };

      // The form defines a fieldset for person, and changes the order of fields
      // but titles should come from the schema
      scope.form = ['*'];

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();
      scope.person.arr[0].name.should.be.equal('Name');
      scope.person.arr[0].nick.should.be.equal('Nick');
      expect(scope.person.arr[0].alias).to.be.undefined;
    });
  });



  it('should remove or add fields/ set defaults depending on condition', function (done) {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {
        flag: false
      };

      scope.schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            'default': 'defaultName'
          }
        }
      };

      scope.form = [
        {
          key: 'name',
          condition: 'person.flag'
        }
      ];

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();
      tmpl.find('.schema-form-text').length.should.be.equal(0);
      
      expect(scope.person.name).to.be.undefined;

      setTimeout(function () {
        scope.person.flag = true;
        $rootScope.$apply();
        tmpl.find('.schema-form-text').length.should.be.equal(1);        
        scope.person.name.should.be.equal('defaultName');
        done();
      }, 0);
    });
  });

  it('should redraw form on schemaFormRedraw event', function (done) {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {};

      scope.schema = {
        type: 'object',
        properties: {
          name: {type: 'string'}
        }
      };

      scope.form = [{
        key: 'name',
        type: 'text'
      }];

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();

      tmpl.find('.schema-form-text').length.should.be.equal(1);
      tmpl.find('.schema-form-textarea').length.should.be.equal(0);

      setTimeout(function () {
        scope.form[0].type = 'textarea';
        scope.$broadcast('schemaFormRedraw');
        $rootScope.$apply();
        tmpl.find('.schema-form-text').length.should.be.equal(0);
        done();
      }, 0);
    });
  });

  it('should redraw form with proper defaults on schemaFormRedraw event', function (done) {
    inject(function ($compile, $rootScope) {
      var scope = $rootScope.$new();
      scope.person = {};

      scope.schema = {
        type: 'object',
        properties: {
          name: {type: 'string'}
        }
      };

      scope.form = [{
        key: 'name',
        type: 'text'
      }];

      scope.options = {formDefaults: {}};

      var tmpl = angular.element('<form sf-schema="schema" sf-form="form" sf-model="person" sf-options="options"></form>');

      $compile(tmpl)(scope);
      $rootScope.$apply();

      expect(tmpl.find('input').attr('disabled')).to.be.undefined;

      var disable, enable;
      disable = function () {
        // form element should be disabled
        scope.options.formDefaults.readonly = true;
        scope.$broadcast('schemaFormRedraw');
        $rootScope.$apply();
        expect(tmpl.find('input').attr('disabled')).eq('disabled');

        // try to re-enable it by modifying global option
        setTimeout(enable, 0);
      };

      enable = function () {
        // form element should be back to enabled
        scope.options.formDefaults.readonly = false;
        scope.$broadcast('schemaFormRedraw');
        $rootScope.$apply();
        expect(tmpl.find('input').attr('disabled')).to.be.undefined;

        done();
      };

      setTimeout(disable, 0);
    });
  });

});
