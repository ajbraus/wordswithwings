var app = angular
            .module('myApp',
                ['ui.ace',
                 'MainController',
                 'Datafactory',
                 'btford.socket-io',
                 'ModuleIndexedDB',
                 'angular-lodash'])
            .factory('socket', function (socketFactory) {
              return socketFactory({
                prefix: 'foo~',
                ioSocket: io.connect()
              });
            });
