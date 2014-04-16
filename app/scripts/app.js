'use strict';

angular.module('lmisChromeApp', [
  'ui.bootstrap',
  'ui.router',
  'tv.breadcrumbs',
  'pouchdb',
  'config'
])
  // Load fixture data
  .run(function(storageService, $rootScope, $state) {

    $rootScope.$on('LOADING_COMPLETED', function(event, args){
       $state.go('home.index.mainActivity');
    });

    $rootScope.$on('START_LOADING', function(event, args){
       $state.go('loadingFixture');
    });

    //attach fast-click to UI to remove 300ms tap delay on mobile version
    try{
      FastClick.attach(document.body);
    }catch(e){
      console.log(e);
    }

    //storageService.clear();

    //load fixtures if not loaded yet.
    storageService.loadFixtures().then(function(result){
          storageService.getAll().then(function(data){
            console.log("finished loading: "+Object.keys(data));
          });
        });

  }).constant('cacheConfig', {
      "id": "lmisChromeAppCache"
    });
