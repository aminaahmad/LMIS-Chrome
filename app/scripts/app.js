'use strict';

angular.module('lmisChromeApp', [
      'ngResource',
      'ngSanitize',
      'ngCookies',
      'ui.bootstrap',
      'ui.router',
      'tv.breadcrumbs',
      'toggle-switch',
      'pouchdb',
      'config'
    ])

  // Disable ui-router auto scrolling
    .config(function ($uiViewScrollProvider, $anchorScrollProvider) {
      $uiViewScrollProvider.useAnchorScroll();
      $anchorScrollProvider.disableAutoScrolling();
    })

  // Central Variable for Watching Online/Offline Events
    .run(function ($window, $rootScope, $state, $stateParams, storageService) {
      //storageService.clear();
      storageService.loadFixtures();

      $rootScope.online = navigator.onLine;

      $window.addEventListener('offline', function () {
        $rootScope.$apply(function () {
          $rootScope.online = false;
        });
      }, false);

      $window.addEventListener('online', function () {
        $rootScope.$apply(function () {
          $rootScope.online = true;
        });
      }, false);

      // Convenience property to get the current state
      $rootScope.$state = $state;
    });
