var materialAdmin = angular.module('materialAdmin', [
    'ngAnimate',
    'ngResource',
    'ngStorage',
    'ui.router',
    'ui.bootstrap',
    'angular-loading-bar',
    'oc.lazyLoad',
    'nouislider',
    'ngTable',
    'firebase'
])
   .run(function ($rootScope, $location, $state, $templateCache) {

        $rootScope.state = $state.$current;
        $rootScope.$on('$stateChangeStart', function (e, toState, toParams
            , fromState, fromParams) {
    
           // console.log($rootScope.uid);
            //console.log((angular.isUndefined($rootScope.auth) || angular.isUndefined($rootScope.uid)));
            var isLogin = toState.name === "login";
            console.log($rootScope.is_auth);
            if (!isLogin &&!$rootScope.is_auth) {

                   e.preventDefault(); // stop current execution
                   $state.go('login'); // ова да се пусне в продукшън


            }

        });
    });
