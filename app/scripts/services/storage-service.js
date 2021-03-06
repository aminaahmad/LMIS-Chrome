'use strict';

angular.module('lmisChromeApp')
    .factory('storageService', function ($q, $rootScope, $http, $window, chromeStorageApi) {

      /**
       *  Global variables used to define table names, with this there will be one
       *  point in the code to add and/or update local storage table names.
       *
       *  table names are matched to the corresponding json file at fixtures
       *  folder that holds data used to pre-fill local storage if it is empty.
       *
       */
      var productTypes = 'product_types';
      var productCategory = 'product_category';
      var address = 'address';
      var uom = 'uom';
      var uomCategory = 'uom_category';
      var facility = 'facility';
      var program = 'programs';
      var programProducts = 'program_products';
      var facilityType = 'facility_type';
      var employeeCategory = 'employee_category';
      var company = 'company';
      var companyCategory = 'company_category';
      var currency = 'currencies';
      var employee = 'employee';
      var rate = 'rate';
      var ccuType = 'ccu_type';
      var ccu = 'ccu';
      var user = 'user';
      var productPresentation = 'product_presentation';
      var productFormulation = 'product_formulations';
      var modeOfAdministration = 'mode_of_administration';
      var batches = 'batches';
      var ccuProblem = 'ccu_problems';
      var ccuTemperatureLog = 'ccu_temp_log';
      var productProfile = 'product_profiles';
      var inventory = 'inventory';
      var orders = 'orders';
      var bundles = 'bundle';
      var bundleLines = 'bundle_lines';
      var bundleReceipt = 'bundle_receipts';
      var bundleReceiptLines = 'bundle_receipt_lines';
      var locations = 'locations';
      var stockCount = 'stockCount';
      var discardCount = 'discardCount';
      var appConfig = 'app_config';
      var stockOut = 'stock_out';
      var surveyResponse = 'survey_response';
      var ccuProfile = 'dhis-ccei-fixture';
      var ccuBreakdown = 'ccu_breakdown';

      /**
       * Add new table data to the chrome store.
       *
       * @param {string} key - Table name.
       * @param {mixed} value - rows of the table (all values are stored as JSON.)
       * @return {Promise} Promise object
       * @private
       */

      function setData(table, data) {
        var deferred = $q.defer();
        var obj = {};
        getData(table).then(function(tableData){
          if(angular.isUndefined(tableData)){
            var tableData = {};
            tableData[data.uuid] = data;
            obj[table] = tableData;
          }else{
            tableData[data.uuid] = data;
            obj[table] = tableData;
          }
          chromeStorageApi.set(obj);
          deferred.resolve(data.uuid);
        }).catch(function(reason){
          deferred.resolve(reason);
        });
        return deferred.promise;
      }

      /**
       * Load init table data to the chrome store.
       *
       * @param {string} table - Table name.
       * @param {mixed} data - object of table rows
       * @return {Promise} Promise object
       * @private
       */
      function setTable(table, data) {
        var obj = {};
        obj[table] = data;
        return  chromeStorageApi.set(obj);
      };


      /**
       * Get table data from the chrome store
       *
       * @param {string} key - Table name.
       * @return {Promise} Promise to be resolved with the settings object
       * @private
       */

      function getData(key) {
        return chromeStorageApi.get(key);
      };

      /**
       * Get All data from the chrome store.
       *
       * @return {Promise} Promise to be resolved with the settings object
       * @private
       */
        // TODO - consider to deprecate
        function getAllFromStore() {
          return chromeStorageApi.get(null, {collection:true});
        };

      /**
       * Remove a table from the chrome store.
       *
       * @param key - Table name.
       * @returns {*|boolean|Array|Promise|string}
       */
        function removeData(key) {
          return chromeStorageApi.remove(key);
        };

      /**
       * Clear all data from the chrome storage (will not work on API).
       *
       * @returns {*|boolean|!Promise|Promise}
       */
        function clearStorage() {
          return chromeStorageApi.clear();
        };

      /**
       * returns current date time string
       * @returns {string|*}
       */
        function getDateTime() {
          return new Date().toJSON();
        };

      /**
       * Insert new database table row.
       *
       * @param table
       * @param data
       * @returns {Promise}
       */
        function insertData(table, data) {
          data['uuid'] = uuidGenerator();
          data['created'] = data['modified'] = getDateTime();
          return setData(table, data);
        };

      /**
       * Update database table row.
       *
       * @param table
       * @param data
       * @returns {Promise}
       */
        function updateData(table, data) {
          //todo: refactor to dateModified
          data['modified'] = getDateTime();
          return setData(table, data);
        };

        /**
         *  Encapsulates insert/update database table row operations.
         *
         * @return {promise}
         */
        function saveData(table, data) {
          if((typeof data === "object") && (data !== null)){
            if(Object.keys(data).indexOf('uuid') !== -1 && data.uuid.length > 0){
              return updateData(table, data);
            } else {
              return insertData(table, data);
            }
          }else{
            var deferred = $q.defer();
            deferred.reject(data+' is null or non-object data.');
            return deferred.promise;
          }
        };

      /**
       * loads fixtures on app startup
       *
       * @returns {promise|promise|*|promise|promise}
       */
      function loadFixtures() {

        var deferred = $q.defer();
        var database = [
          productTypes,
          address,
          uom,
          uomCategory,
          facility,
          program,
          programProducts,
          facilityType,
          employeeCategory,
          company,
          companyCategory,
          currency,
          employee,
          rate,
          ccuType,
          ccu,
          inventory,
          ccuProblem,
          ccuTemperatureLog,
          user,
          productCategory,
          productPresentation,
          productProfile,
          productFormulation,
          modeOfAdministration,
          batches,
          orders,
          bundles,
          bundleLines,
          bundleReceipt,
          locations,
          stockOut,
          ccuProfile
        ];
        var isLoading = false;
        function loadData(db_name) {
          getData(db_name).then(function (data) {
                if (angular.isUndefined(data)) {

                  var file_url = 'scripts/fixtures/' + db_name + '.json';
                  $http.get(file_url).success(function (data) {
                    setTable(db_name, data).then(function (res) {
                      isLoading = false;
                    }, function (err) {
                      isLoading = false;
                    });
                  }).error(function (err) {
                    console.log(err);
                    isLoading = false;
                  });
                }
                else {
                  isLoading = false;
                }

              },
              function (reason) {
                isLoading = false;
                console.log('error loading ' + db_name + ' ' + reason);
              }
          );
        };

        var loadNext = function(i)
        {
          if(!isLoading)
          {
            $rootScope.$emit('START_LOADING', {started: true});
            isLoading=true;
            loadData(database[--i]);
          }
          if(i > 0){

            setTimeout(function() { loadNext(i) }, 10);
          }else{
            //this is when the app is actually ready
           $rootScope.$emit('LOADING_COMPLETED', {completed: true});
           deferred.resolve(true);
          }
        };
        loadNext(database.length);
        return deferred.promise;
      };


    function uuidGenerator() {
      var now = Date.now();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (now + Math.random() * 16) % 16 | 0;
        now = Math.floor(now / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
      return uuid;
    };

    function getFromTableByKey(tableName, key) {
      var deferred = $q.defer();
      var key = String(key);//force conversion to string
      getData(tableName)
          .then(function (data) {
            deferred.resolve(data[key]);
          })
          .catch(function (reason) {
            deferred.reject(reason);
          });
      return deferred.promise;
    };

      /**
      * TODO: there must be a better framework way of doing this.
      * this is basically just filter() but the idea is that there are probably ways to pass this
      * to the storage layer to get the filtering done in the db, so make it a separae fn and figure that out later
      */
      function getFromTableByLambda(tableName, fn)
      {
        var deferred = $q.defer();
        var results = [];
        try {
          getData(tableName).then(function (data) {
            results = data.filter(fn);
            deferred.resolve(results);
            if (!$rootScope.$$phase) $rootScope.$apply();
          });
        } catch (e) {
          deferred.resolve(results);
          if (!$rootScope.$$phase) $rootScope.$apply();
        } finally {
          return deferred.promise;
        }
      }

      /**
       * This returns an array or collection of rows in the given table name, this collection can not be
       * indexed via key, to get table rows that can be accessed via keys use all() or getData()
       */

      function getAllFromTable(tableName) {
        var deferred = $q.defer();
        getData(tableName).then(function (data) {
          var rows = [];
          for (var key in data) {
            rows.push(data[key]);
          }
          deferred.resolve(rows);
        }).catch(function(reason){
          deferred.reject(reason);
        });
        return deferred.promise;
      };

      function insertBatch(tableName, batchList){
        var deferred = $q.defer();
        getData(tableName).then(function(tableData){
          var batches = (angular.isArray(batchList))? batchList : [];
          var results = [];
          console.log(tableName+" "+tableData);
          for(var index in batches){
            var batch = batches[index];
            var hasUUID = batch.hasOwnProperty('uuid');
            batch['uuid'] = hasUUID? batch['uuid'] : uuidGenerator();
            batch['created'] = hasUUID? batch['created'] : getDateTime();
            batch['modified'] = hasUUID? '0000-00-00 00:00:00' : getDateTime();
            tableData[batch.uuid] = batch;
            results.push(setData(tableName, tableData).then(function(result){
              return batch['uuid'];
            }, function(error){
              console.log(error);
            }));
            batches[index] = batch;
          }
          console.log(results);
          console.log(batches.length);
          (results.length === batches.length)? deferred.resolve(batches): deferred.resolve("batch insertion failed");;
        });
        return deferred.promise;
      };

      return {
        all: getAllFromTable,
        add: setData,
        get: getData,
        getAll: getAllFromStore,
        remove: removeData, // removeFromChrome,
        clear: clearStorage, // clearChrome */
        uuid: uuidGenerator,
        loadFixtures: loadFixtures,
        insert: insertData,
        update: updateData,
        save: saveData,
        where: getFromTableByLambda,
        find: getFromTableByKey,
        insertBatch: insertBatch,
        PRODUCT_TYPES: productTypes,
        PRODUCT_CATEGORY: productCategory,
        ADDRESS: address,
        UOM: uom,
        UOM_CATEGORY: uomCategory,
        FACILITY: facility,
        PROGRAM: program,
        PROGRAM_PRODUCTS: programProducts,
        FACILITY_TYPE: facilityType,
        EMPLOYEE_CATEGORY: employeeCategory,
        COMPANY: company,
        COMPANY_CATEGORY: companyCategory,
        CURRENCY: currency,
        EMPLOYEE: employee,
        RATE: rate,
        CCU_TYPE: ccuType,
        CCU: ccu,
        USER: user,
        PRODUCT_PRESENTATION: productPresentation,
        PRODUCT_FORMULATION: productFormulation,
        MODE_OF_ADMINISTRATION: modeOfAdministration,
        BATCH: batches,
        CCU_PROBLEM: ccuProblem,
        CCU_TEMPERATURE_LOG: ccuTemperatureLog,
        PRODUCT_PROFILE: productProfile,
        INVENTORY: inventory,
        ORDERS: orders,
        BUNDLE: bundles,
        BUNDLE_LINES: bundleLines,
        BUNDLE_RECEIPT: bundleReceipt,
        BUNDLE_RECEIPT_LINES: bundleReceiptLines,
        LOCATIONS: locations,
        STOCK_COUNT: stockCount,
        DISCARD_COUNT: discardCount,
        APP_CONFIG: appConfig,
        STOCK_OUT: stockOut,
        SURVEY_RESPONSE: surveyResponse,
        CCU_PROFILE: ccuProfile,
        CCU_BREAKDOWN: ccuBreakdown
      };

    });
