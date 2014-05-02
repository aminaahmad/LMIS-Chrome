'use strict';

angular.module('lmisChromeApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('stockCountHome', {
        parent: 'root.index',
        url: '/stockCountHome',
        data: {
          label: 'Stock Count Home'
        },
        templateUrl: 'views/stockcount/index.html',
        resolve: {
          appConfig: function(appConfigService){
            return appConfigService.getCurrentAppConfig();
          },
          stockCountList: function(stockCountFactory){
            return stockCountFactory.get.allStockCount();
          },
          productProfiles: function(stockCountFactory){
            return stockCountFactory.get.productProfile();
          }
        },
        controller: function($scope, stockCountFactory, stockCountList, appConfig, productProfiles, $state, $filter){
          console.log(appConfig);
          $scope.productProfiles = productProfiles;
          $scope.stockCountList = stockCountList;
          $scope.stockCountByDate = stockCountFactory.get.stockCountListByDate($scope.stockCountList);
          $scope.facilityObject = appConfig.appFacility;
          $scope.facilityProducts = stockCountFactory.get.productObject(appConfig.selectedProductProfiles); // selected products for current facility

          $scope.facilityProductsKeys = Object.keys($scope.facilityProducts); //facility products uuid list

          var now = new Date();
          $scope.currentDay = now.getDate();
          $scope.day = $scope.currentDay;
          $scope.currentMonth = (now.getMonth()+1) < 10 ? '0'+(now.getMonth()+1) : now.getMonth()+1;
          $scope.month = $scope.currentMonth;
          $scope.currentYear = now.getFullYear();
          $scope.year = $scope.currentYear;
          $scope.monthList = stockCountFactory.monthList;
          $scope.startDate = new Date();
          $scope.appConfig = appConfig;

          $scope.dateActivated = appConfig.dateActivated;
          $scope.countInterval = appConfig.stockCountInterval;
          $scope.reminderDay= appConfig.reminderDay;
          $scope.maxList = 10;

          $scope.dateList = stockCountFactory.get.stockCountByIntervals($scope);
          $scope.dayInMonth = stockCountFactory.get.daysInMonth($scope.month, $scope.year).splice(0, $scope.currentDay).reverse();
          $scope.daysInMonthRange = $scope.dayInMonth.splice(0, 10);

          $scope.missedEntry = function(date){
           return stockCountFactory.get.missingEntry(date, $scope);
          };
          $scope.takeActon = function(date){
            var missed = $scope.missedEntry(date);
            stockCountFactory.getStockCountByDate(date).then(function(stockCount){
              if(stockCount !== null){
                $scope.stockCount = stockCount;
                $scope.detailView = true;
                if($filter('date')(new Date(), 'yyyy-MM-dd') !== $filter('date')(stockCount.countDate, 'yyyy-MM-dd')){
                  $scope.editOff = true;
                }
                $scope.mergedList = stockCountFactory.get.mergedStockCount(stockCount.unopened, $scope.facilityProductsKeys);
              }
              else if(!missed){
                $state.go('stockCountForm', {countDate: date});
              }
            });
          };
        }
      })
      .state('stockCountForm', {
        parent: 'root.index',
        data:{
          label:'Stock Count Form'
        },
        url:'/stockCountForm?facility&reportMonth&reportYear&reportDay&countDate&productKey',
        templateUrl: 'views/stockcount/stock-count-form.html',
        controller: 'StockCountFormCtrl',
        resolve:{
          appConfig: function(appConfigService){
            return appConfigService.load();
          },
          productType: function(stockCountFactory){
            return stockCountFactory.productType();
          }
        }
      })
      .state('syncStockCount', {
        parent: 'root.index',
        abstract: true,
        templateUrl: 'views/stockcount/sync.html'
      })
      .state('syncStockCount.detail', {
        data: {
          label: 'Sync stock count'
        },
        url: '/sync-stock-count',
        resolve: {
          localDocs: function(pouchdb) {
            var db = pouchdb.create('stockcount');
            // XXX: db#info returns incorrect doc_count, see item:333
            return db.allDocs();
          }
        },
        views: {
          'stats': {
            templateUrl: 'views/stockcount/sync/stats.html',
            controller: function($q, $log, $scope, i18n, config, pouchdb, localDocs, alertsFactory) {
              var dbName = 'stockcount',
                  remote = config.api.url + '/' + dbName;

              var updateCounts = function() {
                $scope.local = {
                  // jshint camelcase: false
                  doc_count: localDocs.total_rows
                };

                $scope.remoteSyncing = true;
                var _remote = pouchdb.create(remote);
                _remote.info()
                  .then(function(info) {
                    $scope.remote = info;
                    $scope.remoteSyncing = false;
                  })
                  .catch(function(reason) {
                    $log.error(reason);
                  });
              };

              updateCounts();

              var sync = function(source) {
                var deferred = $q.defer();
                alertsFactory.info(i18n('syncing', source.label));
                $scope.syncing = true;
                var cb = {
                  complete: function() {
                    $scope.syncing = false;
                    alertsFactory.success(i18n('syncSuccess', source.label));
                    deferred.resolve();
                  }
                };
                var db = pouchdb.create(source.from);
                db.replicate.to(source.to, cb);
                return deferred.promise;
              };

              $scope.sync = function() {
                var promises = [
                  sync({
                    from: dbName,
                    to: remote,
                    label: i18n('local')
                  }),
                  sync({
                    from: remote,
                    to: dbName,
                    label: i18n('remote')
                  }),
                ];

                $q.all(promises)
                  .then(function() {
                    updateCounts();
                  });
              };
            }
          },
          'status': {
            templateUrl: 'views/stockcount/sync/status.html',
            controller: function($log, $scope, localDocs, config, pouchdb) {
              $scope.locals = localDocs.rows.map(function(local) {
                return local.id;
              });

              $scope.compare = function() {
                $scope.syncing = true;
                var remote = pouchdb.create(config.api.url + '/stockcount');
                remote.allDocs()
                  .then(function(remotes) {
                    remotes = remotes.rows.map(function(remote) {
                      return remote.id;
                    });
                    $scope.synced = [];
                    $scope.unsynced = {
                      local: [],
                      remote: []
                    };

                    for (var i = 0, len = $scope.locals.length; i < len; i++) {
                      if(remotes.indexOf($scope.locals[i]) !== -1) {
                        $scope.synced.push($scope.locals[i]);
                      }
                      else {
                        $scope.unsynced.local.push($scope.locals[i]);
                      }
                    }

                    for (var j = remotes.length - 1; j >= 0; j--) {
                      if($scope.locals.indexOf(remotes[j]) === -1) {
                        $scope.unsynced.remote.push(remotes[j]);
                      }
                    }
                  })
                  .catch(function(reason) {
                    $log.error(reason);
                  })
                  .finally(function() {
                    $scope.syncing = false;
                  });
              };
            }
          }
        }
      });
  })
  .controller('StockCountFormCtrl', function($scope, stockCountFactory, $state, alertsFactory, $stateParams, appConfig, productType, $log, i18n, pouchdb, config){
    var now = new Date();
    var day = now.getDate();
    day = day < 10 ? '0' + day : day;

    var month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    $scope.productType = productType;

    $scope.step = 0;
    $scope.monthList = stockCountFactory.monthList;
    /*
     * get url parameters
     */
    $scope.facilityObject = appConfig.appFacility;
    $scope.facilityUuid = ($stateParams.facility !== null)?$stateParams.facility:$scope.facilityObject.uuid;
    $scope.reportDay = ($stateParams.reportDay !== null)?$stateParams.reportDay: day;
    $scope.reportMonth = ($stateParams.reportMonth !== null)?$stateParams.reportMonth:month;
    $scope.reportYear = ($stateParams.reportYear !== null)?$stateParams.reportYear: now.getFullYear();

    $scope.preview = false;
    $scope.editOn = false;


    $scope.stockCount = {};
    $scope.stockCount.unopened = {};
    $scope.stockCount.countDate = '';
    $scope.alertMsg = 'stock count value is invalid, at least enter Zero "0" to proceed';
    $scope.facilityProducts = stockCountFactory.get.productObject(appConfig.selectedProductProfiles); // selected products for current facility
    $scope.facilityProductsKeys = Object.keys($scope.facilityProducts); //facility products uuid list
    $scope.productKey = $scope.facilityProductsKeys[$scope.step];

    //set maximum steps
    if($scope.facilityProductsKeys.length>0){
      $scope.maxStep =  $scope.facilityProductsKeys.length-1;
    }
    else{
      $scope.maxStep =0;
    }

    $scope.edit = function(index){
      $scope.step = index;
      $scope.productKey = $scope.facilityProductsKeys[$scope.step];
      $scope.preview = false;
      $scope.editOn = true;
    };

    $scope.selectedFacility = stockCountFactory.get.productReadableName($scope.facilityProducts, $scope.step);
    $scope.productTypeCode = stockCountFactory.get.productTypeCode($scope.facilityProducts, $scope.step, $scope.productType);

    var timezone = stockCountFactory.get.timezone();

    //load existing count for the day if any.
    var date = $scope.reportYear+'-'+$scope.reportMonth+'-'+$scope.reportDay;
    if($stateParams.countDate){
      date = $stateParams.countDate;
      $scope.reportDay = new Date(Date.parse(date)).getDate();
    }
    stockCountFactory.getStockCountByDate(date).then(function(stockCount){
      if(stockCount !== null){
        $scope.stockCount = stockCount;
        $scope.editOn = true; // enable edit mode
        if(angular.isUndefined($scope.stockCount['lastPosition'])){
          $scope.stockCount['lastPosition'] = 0;
        }
      }
    });

    $scope.save = function() {
      var dbName = 'stockcount',
          db = pouchdb.create(dbName);

      $scope.stockCount.facility = $scope.facilityUuid;
      $scope.stockCount.countDate = new Date($scope.reportYear, parseInt($scope.reportMonth)-1, $scope.reportDay, timezone);

      var backupStock = function(doc) {
        //TODO: remove controller-specific db syncs, do in background
        //using sync-service

        db.put(doc)
          .then(function() {
            var cb = {complete: function() {
              alertsFactory.success(i18n('syncSuccess'));
              if($scope.redirect) {
                var msg = [
                  'You have completed stock count for',
                  $scope.reportDay,
                  $scope.monthList[$scope.reportMonth],
                  $scope.reportYear
                ].join(' ');
                alertsFactory.success(msg);
                $state.go('home.index.home.mainActivity', {
                  'facility': $scope.facilityUuid,
                  'reportMonth': $scope.reportMonth,
                  'reportYear': $scope.reportYear,
                  'stockResult': msg
                });
              }
            }};
            db.replicate.to(config.api.url + '/' + dbName, cb);
          })
          .catch(function(reason) {
            $state.go('home.index.home.mainActivity');
            var message = '';
            if(reason.message) {
              message = reason.message + '. ';
            }
            message += i18n('syncLater');
            alertsFactory.danger(message, {persistent: true});
          });
      };

      //hack: dateSynced should be set and saved AFTER backup so we know it actually happened.
      //this is managed in sync-service but stockcount uses its own syncing. FIX
      $scope.stockCount.dateSynced = new Date().toJSON();
      stockCountFactory.save.stock($scope.stockCount)
        .then(function() {
          if($scope.redirect) {
            alertsFactory.success(i18n('stockCountSaved'));
            var obj = $scope.stockCount;
            obj._id = obj.uuid;
            db.get(obj._id)
              .then(function(doc) {
                if(doc._rev) {
                  obj._rev = doc._rev;
                }
              })
              .finally(function() {
                backupStock(obj);
              });
          }
        });
    };

    $scope.$watch('stockCount.unopened[productKey]', function(newvalue){
      if(stockCountFactory.validate.invalid(newvalue)){
        //stockCountFactory.get.errorAlert($scope, 1);
      }else{
        $scope.redirect = false;
        $scope.stockCount.lastPosition = $scope.step;
        if(angular.isUndefined($scope.stockCount['isComplete'])){
          $scope.stockCount.isComplete = 0;
        }
        $scope.save();
        stockCountFactory.get.errorAlert($scope, 0);
      }
    });
    $scope.finalSave = function(){
      if('stockCount' in $scope) {
        $scope.stockCount.lastPosition = 0;
        $scope.stockCount.isComplete = 1;
      }
      $scope.redirect = true;
      $scope.save();
    };
    $scope.changeState = function(direction){
      $scope.currentEntry = $scope.stockCount.unopened[$scope.facilityProductsKeys[$scope.step]];
      if(stockCountFactory.validate.invalid($scope.currentEntry) && direction !== 0){
        stockCountFactory.get.errorAlert($scope, 1);
      }
      else{
        stockCountFactory.get.errorAlert($scope, 0);
        if(direction !== 2){
          $scope.step = direction === 0? $scope.step-1 : $scope.step + 1;
        }
        else{
          $scope.preview = true;
        }
        $scope.productKey = $scope.facilityProductsKeys[$scope.step];
      }
      $scope.selectedFacility = stockCountFactory.get.productReadableName($scope.facilityProducts, $scope.step);

      $scope.productTypeCode = stockCountFactory.get.productTypeCode($scope.facilityProducts, $scope.step, $scope.productType);
    };
  });
