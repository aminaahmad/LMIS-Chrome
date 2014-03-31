'use strict';

describe('Service: alertsFactory', function() {

  // load the service's module
  beforeEach(module('lmisChromeApp', 'lmisChromeAppMocks'));

  // instantiate service
  var alertsFactory, scope;
  beforeEach(inject(function(_alertsFactory_, $rootScope) {
    alertsFactory = _alertsFactory_;
    scope = $rootScope.$new();
  }));

  var loadMockedTemplates = function($templateCache) {
    var templates = [
      'index',
      'nav',
      'sidebar',
      'control-panel',
      'dashboard',
      'dashboard/chart',
      'dashboard/table',
      'main-activity'
    ];

    templates.forEach(function(template) {
      $templateCache.put('views/home/' + template + '.html', '');
    });
  };

  it('should attach an alerts array to the root scope', function() {
    expect(scope.alerts).toBeDefined();
    expect(scope.alerts.length).toEqual(0);
  });

  it('should add an alert to the root scope', function() {
    alertsFactory.info('Test');
    expect(scope.alerts.length).toEqual(1);
  });

  it('should provide a remove method', function() {
    expect(alertsFactory.remove).toBeDefined();
  });

  it('should remove an alert by its index', function() {
    expect(scope.alerts.length).toEqual(0);
    alertsFactory.info('Test');
    alertsFactory.remove(0);
    expect(scope.alerts.length).toEqual(0);
  });

  it('should not clobber other alerts when removing', function() {
    var nucleobases = ['Guanine', 'Adenine', 'Thymine', 'Cytosine'];
    nucleobases.forEach(function(nucleobase) {
      alertsFactory.info(nucleobase);
    });
    expect(scope.alerts.length).toEqual(4);
    alertsFactory.remove(2);
    expect(scope.alerts.length).toEqual(3);
    var cytosine = scope.alerts[2];
    expect(cytosine.message).toEqual(nucleobases[3]);
  });

  it('should provide a clear all alerts method', function() {
    expect(alertsFactory.clear).toBeDefined();
  });

  it('should clear alerts when asked', function() {
    var nucleobases = ['Guanine', 'Adenine', 'Thymine', 'Cytosine'];
    nucleobases.forEach(function(nucleobase) {
      alertsFactory.info(nucleobase);
    });
    expect(scope.alerts.length).toEqual(4);
    alertsFactory.clear();
    expect(scope.alerts.length).toEqual(0);
  });

  it('should expose a remove method aliased as "closeAlert"', function() {
    expect(scope.closeAlert).toBeDefined();
  });

  it('should clear alerts when moving between states', function() {
    var ma = 'home.index.mainActivity',
        dash = 'home.index.dashboard.chart';

    inject(function($templateCache, $state) {
      loadMockedTemplates($templateCache);

      scope.$apply(function() {
        $state.go(ma);
        alertsFactory.info('Test');
        expect(scope.alerts.length).toEqual(1);
      });

      scope.$apply(function() {
        $state.go(dash);
        expect(scope.alerts.length).toEqual(0);
      });
    });
  });

  it('should remove alerts after five seconds', function() {
    inject(function($timeout, $templateCache) {
      loadMockedTemplates($templateCache);
      alertsFactory.info('');
      expect(scope.alerts.length).toEqual(1);
      $timeout.flush();
      expect(scope.alerts.length).toEqual(0);
    });
  });

  describe('levels', function() {
    it('should expose alert levels', function() {
      var levels = ['success', 'info', 'warning', 'danger'];
      levels.forEach(function(level) {
        expect(alertsFactory[level]).toBeDefined();
      });
    });

    it('should set an alert type to success if asked to', function() {
      var expected = {
        type: 'success',
        message: 'Success message'
      };

      alertsFactory.success(expected.message);
      expect(scope.alerts[0]).toEqual(expected);
    });

    it('should set an alert type to info if asked to', function() {
      var expected = {
        type: 'info',
        message: 'Info message'
      };

      alertsFactory.info(expected.message);
      expect(scope.alerts[0]).toEqual(expected);
    });

    it('should set an alert type to warning if asked to', function() {
      var expected = {
        type: 'warning',
        message: 'Warning message'
      };

      alertsFactory.warning(expected.message);
      expect(scope.alerts[0]).toEqual(expected);
    });

    it('should set an alert type to danger if asked to', function() {
      var expected = {
        type: 'danger',
        message: 'Danger message'
      };

      alertsFactory.danger(expected.message);
      expect(scope.alerts[0]).toEqual(expected);
    });
  });

});
