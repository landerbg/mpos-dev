materialAdmin
    .controller('productsCtrl', function ($scope, $location, product_service, db, growlService, globalConfig, ngTableParams, tableService, $filter) {

        var vm = this;
        vm.products = db.getProducts();
        vm.search = false;
        $scope.$watch(angular.bind(this, function () {
            return vm.products.length;
        }), function (newVal) {
            vm.tableFilter.reload();
        });

        //console.log(db.products);
        vm.tableFilter = new ngTableParams({
            page: 1,            // show first page
            count: globalConfig.productsTableRows
        }, {
            total: vm.products.length, // length of data
            getData: function ($defer, params) {
                // use build-in angular filter
                var orderedData = params.filter() ? $filter('filter')(vm.products, params.filter()) : vm.products;
                this.number = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.name = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.price = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.lastdev_price = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.partner = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                params.total(orderedData.length); // set total for recalc pagination
                $defer.resolve(this.number, this.name, this.price, this.lastdev_price, this.partner);
            }
        })
        //console.log(data);

        vm.edit_product = function (product) {
            product_service.set_product(product);
            $location.path('app/product/product-main');

        };


        vm.remove_product = function (product) {
            swal({
                title: "Сигурни ли сте?",
                text: "Артикул " + product.name + " ще бъде безвъзвратно изтрит?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#F44336",
                confirmButtonText: "Да изтрий!",
                closeOnConfirm: false
            }, function () {
                db.remove_product(product);
                swal("Ок", "Артикулът е успешно изтрит", "success");
            });

        }


        vm.add_product = function () {
            product_service.set_product(null);
            $location.path('app/product/product-main');

        };
    })
    .controller('productCtrl', function ($location, growlService, product_service, db) {

        var vm = this;
        vm.edit = 1;
        vm.selected = product_service.get_product() || {};
        vm.currency = db.getCurrency();
        vm.measures = db.getMeasures();
        vm.groups = db.getGroups();

        vm.barcodes = db.getBarcodes();
        if (!product_service.get_product()) {
            vm.edit = 0;
        }


        vm.returnBack = function () {
            $location.path('app/products');
        }


        vm.getFirstNumber = function (value) {
            var temp = db.getProducts(); //Това е масива с обекти в който element.number e поредното число
            var len = temp.length;
            var i = 1;
            if (temp[len - 1].number < value)
                return value + 1; //Ако подаденото число е по голямо от най големия елемент в масива направо връща числото + 1
            if (value < temp[0].number + 1) { //Това е нагласяне за първите елементи, което не ми харесва.
                if (value == 0) {
                    if (temp[0].number >= 2)
                        return 1
                }
                if (value == 1)
                    if (temp[0].number > 2)
                        return 1;
            }
            for (i; i < len; i++) {
                if (temp[i].number > value + 1) {
                    if (temp[i].number > temp[i - 1].number + 1) {
                        if (temp[i - 1].number + 1 > value) {
                            return temp[i - 1].number + 1;
                        }
                        else {
                            return value + 1;
                        }
                    }
                }
            }
            if (temp[len - 1].number < value)
                return value + 1;
            else
                return temp[len - 1].number + 1;

        }


        vm.filterBarcodes = function (id) {
            console.log(id);//Towa da se proveri kak ste raboti s mnogo barcodove
            var result = {};
            angular.forEach(vm.barcodes, function (value, key) {
                if (value === id) {
                    result[key] = value;
                }
            });
            console.log(result);
            return result;

        }


        vm.delBarcode = function (key) {

            db.delBarcode(key);
        }


        vm.addBarcode = function () {
            db.addBarcode(vm.added_barcode, vm.selected.$id);
            vm.added_barcode = null;
            angular.element('#barcode-input').focus();


        }


        vm.submit = function (message) {
            if (vm.edit === 1) {
                vm.edit = 0;
                db.update_product(vm.selected);

                $location.path('app/products');
                growlService.growl('Редактиран успешно', 'success');
            }
            else {
                vm.edit = 0;
                db.add_product(vm.selected);
                vm.selected = {};
                swal("Done!", "Артикулът е създаден успешно", "success");
            }

        }

    })
    .controller('loginCtrl', function ($state, growlService, $firebaseAuth, globalConfig, $rootScope, $firebaseObject, db) {

        var vm = this;


        vm.login = 1;
        vm.register = 0;
        vm.forgot = 0;
        vm.email = globalConfig.defaultEmail;
        vm.password = globalConfig.defaultPassword;

        $rootScope.auth = $firebaseAuth(firebase.auth());
        $rootScope.ref = firebase.database().ref();

        vm.loginFunction = function (email, password) {

            $rootScope.auth.$signInWithEmailAndPassword(email, password).then(function (authData) {
                //  console.log("Logged in as:", authData.uid);
                $rootScope.uid = authData.uid;
                $rootScope.is_auth = true;
                var temp = $firebaseObject($rootScope.ref.child(authData.uid).child('user'));
                temp.$loaded().then(function () {
                    growlService.growl('Добре дошъл ' + temp.name + "! Зареждаме вашите данни.", 'success');
                    db.getDb();

                })
            }).catch(function (error) {
                growlService.growl(error, 'danger');
                console.error("Authentication failed:", error);
            });
        }


        vm.createNewUser = function (new_email, new_pass, new_username) {
            $rootScope.auth.$createUser({
                email: new_email,
                password: new_pass
            }).then(function (userData) {
                console.log("User " + userData.uid + " created successfully!");
                $rootScope.ref.child(userData.uid).child('user').set({'email': new_email, 'name': new_username});
                growlService.growl('Успешно създаден', 'success');
                vm.loginFunction(new_email, new_pass);
            })
                .catch(function (error) {
                    console.log('Неуспешно създаване на потребител ' + error);
                    growlService.growl(error, 'danger');
                })
        }
    })


    .controller('logoutCtrl', function ($state, growlService, $rootScope, db) {

        var hm = this;
        hm.user = db.getUser();


        this.logout = function () {
            db.clearDb();
            $state.go('login');
        }
    })
    .controller('infoDayCtrl', function (db) {
        var im = this;
        im.day_info = db.getDayInf();
        console.log(im.day_info.total);
        console.log(im.day_info.profit);
    })

    .controller('posCtrl', function (growlService, $rootScope, db, $http, $localStorage) {
        var pm = this;
        pm.showed_group = "";
        pm.group_page = 0;
        pm.products = db.getProducts();
        pm.barcodes = db.getBarcodes();
        pm.groups = db.getGroups();
        pm.current_order = [];
        pm.group_step = 5;//ДА отиде в някаква глобална конфигурация
        pm.selected = null;
        pm.pending_orders = $localStorage.pending_orders;
        pm.barcode = "";
        angular.element('#pos-search').focus();
        pm.total = 0;
        pm.showPending = function () {
            growlService.growl($localStorage.pending_orders);

        }
        pm.prevGroupPage = function () {
            if (pm.group_page > 0)
                pm.group_page = pm.group_page - pm.group_step;
        }
        pm.nextGroupPage = function () {
            if (pm.group_page + 5 < pm.groups.length)
                pm.group_page = pm.group_page + pm.group_step;
        }


        pm.shortcuts = function (event) // Функция за глобални шорткъти в ПОС-а
        {
            if ((event.keyCode || event.which) > '111' && (event.keyCode || event.which) < '122') {
                event.preventDefault();
                growlService.growl(event.keyCode + " Pressed!", 'info');

            }
            console.debug(event);

        }
        pm.getTotal = function () {
            var total = 0;

            for (var i = 0; i < pm.current_order.length; i++) {
                var pr = pm.current_order[i];
                total += (parseFloat(pr.price) * pr.ammount);

            }
            console.log('Тотал ' + total);
            return total;
        }
        pm.getProfit = function () {
            var total = 0;

            for (var i = 0; i < pm.current_order.length; i++) {
                var pr = pm.current_order[i];
                total += (parseFloat(pr.price) - (parseFloat(pr.lastdev_price || 0))) * pr.ammount;

            }
            console.log('Печалба ' + total);
            return total;
        }
        pm.activateRow = function (id) {
            pm.selected = id;
        }
        pm.orderPlus = function (barcode) {
            function stringIsNumber(s) {
                var x = +s; // made cast obvious for demonstration
                return x.toString() === s;
            }


            var temp2 = barcode.split("*");
            var ammount = 1;
            //console.log(barcode);
            if (temp2.length > 1) {
                for (var n = 0; n < temp2.length - 1; n++) {
                    console.log(temp2[n] + " - " + stringIsNumber(temp2[n]));

                    if (stringIsNumber(temp2[n])) {
                        ammount *= temp2[n];

                    }
                    else growlService.growl("Невалидна стойност за количество", 'danger');
                }
                barcode = temp2[temp2.length - 1];
            }
            //console.log(barcode);
            //pm.products['sell_qty'] = 2;
            var temp = pm.products.$getRecord(pm.barcodes[barcode]);
            if (temp !== null) {

                pm.current_order.push({
                    'name': temp.name,
                    'number': temp.number,
                    'price': parseFloat(temp.price),
                    'art_id': temp.$id,
                    'ammount': ammount,
                    lastdev_price: parseFloat(temp.lastdev_price),
                    avg_price: parseFloat(temp.lastdev_price)
                });
            }
            else
                growlService.growl("Няма такъв баркод", 'danger');

            pm.barcode = "";
            angular.element('#pos-search').focus();

        }
        pm.touch_button = function (art, ammount) {
            pm.current_order.push({
                'name': art.name,
                'number': art.number,
                'price': art.price,
                'lastdev_price': art.lastdev_price,
                'art_id': art.$id,
                'ammount': ammount
            });
            pm.barcode = "";
            angular.element('#pos-search').focus();

        }
        pm.removeRow = function (id) {

            pm.current_order.splice(id, 1);

            angular.element('#pos-search').focus();

        };

        pm.make_bon = function (order) {
            var bon = "{";
            bon += '"N":"' + order.length + '",';
            for (var i = 1; i < order.length + 1; i++) {
                bon += '"n_' + i + '":"' + order[i - 1].name + '",' + '"p_' + i + '":"' + order[i - 1].price + '",' + '"v_' + i + '":' + '"2"' + ',' + '"q_' + i + '":"' + order[i - 1].ammount + '"';
                if (i < order.length)
                    bon += ',';
            }
            bon += "}";
            return bon;
        }


        pm.finishOrderFisc = function () {
            var source = 'http://127.0.0.1:8888/fp/index.php?callback=JSON_CALLBACK&demo=' + pm.make_bon(pm.current_order);
            console.log(source);
            var responsePromise = $http.jsonp(source, {});

            responsePromise.success(function (data, status, headers, config) {
                switch (data.status) {
                    case "0":
                        growlService.growl('Проблем при изпечатване на касов бон! <br/> Проверете фискалното устройство и опитайте отново!', 'danger');
                        break;
                    default:
                        growlService.growl('Успешен печат на касов бон!', 'success');
                        pm.finishOrder();

                }
                // http://127.0.0.1/ABC/print.php?iN=1&p_1=[цена]&n_1=[име]&v_1=[данъчна група]&q_1=[количество]"
                console.log(data);
                console.log(data.status);

            });
            responsePromise.error(function (data, status, headers, config) {
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
            });
        };

        pm.finishOrder = function () {
            //console.log('function');
            pm.selected = -1;
            if (pm.current_order.length > 0) {


                var qorder = {'total': pm.getTotal(), 'profit': pm.getProfit()};

                db.finishOrder(pm.current_order, qorder);
                console.log(pm.current_order);
                pm.current_order = [];
                angular.element('#pos-search').focus();
            }
        }

        pm.removeAmount = function (id) { //Това не работи зарадъ ксътъм номерацията която съм направил.Трябва да са с уникални може би

            console.log(id);
            if (pm.current_order[id].ammount > 1)
                pm.current_order[id].ammount--;
            angular.element('#pos-search').focus();

        }

        pm.addAmount = function (id) { //Това не работи зарадъ ксътъм номерацията която съм направил.Трябва да са с уникални може би


            pm.current_order[id].ammount++;
            angular.element('#pos-search').focus();

        }
        pm.clearOrder = function () {
            pm.selected = -1;
            console.log('asdasd');
            pm.current_order = [];
            angular.element('#pos-search').focus();
        }


    })
    .controller('measuresCtrl', function (db, $scope, growlService, ngTableParams, tableService, $filter) {
        var mc = this;
        mc.measure = {};
        mc.is_edit = false;
        mc.measures = db.getMeasures();
        mc.isNavCollapsed = false;


        mc.edit_measure = function (measure) {
            mc.is_edit = true;
            mc.measure = measure;
            mc.isNavCollapsed = true;

        };


        mc.remove_measure = function (measure) {
            swal({
                title: "Сигурни ли сте?",
                text: "Записът " + measure.name + " ще бъде безвъзвратно изтрит?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#F44336",
                confirmButtonText: "Да изтрий!",
                closeOnConfirm: false
            }, function () {
                db.remove_measure(measure);
                swal("Ок", "Записът е успешно изтрит", "success");
            });

        };


        mc.save_measure = function () {
            if (!mc.is_edit)
                db.add_measure(mc.measure);
            else
                db.update_measure(mc.measure);

            mc.measure = {};
            mc.is_edit = false;
            mc.isNavCollapsed = false;
        };


    })
    .controller('partnersCtrl', function (db, $scope, growlService, ngTableParams, tableService, $filter, globalConfig) {
        var pc = this;

        pc.partners = db.getPartners();
        pc.search = false;
        $scope.$watch(angular.bind(this, function () {
            return pc.partners.length;
        }), function (newVal) {
            pc.tableFilter.reload();
        });

        //console.log(db.products);
        pc.tableFilter = new ngTableParams({
            page: 1,            // show first page
            count: globalConfig.partnersTableRows
        }, {
            total: pc.partners.length, // length of data
            getData: function ($defer, params) {
                // use build-in angular filter
                var orderedData = params.filter() ? $filter('filter')(pc.partners, params.filter()) : pc.partners;
                this.number = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.name = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.eik = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.address = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                this.mol = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                params.total(orderedData.length); // set total for recalc pagination
                $defer.resolve(this.number, this.name, this.eik, this.address, this.mol);
            }
        })

        pc.isNavCollapsed = false;
        pc.is_edit = false;

        pc.edit_partner = function (partner) {
            pc.is_edit = true;
            pc.partner = partner;
            pc.isNavCollapsed = true;

        };


        pc.remove_partner = function (partner) {
            swal({
                title: "Сигурни ли сте?",
                text: "Записът " + partner.name + " ще бъде безвъзвратно изтрит?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#F44336",
                confirmButtonText: "Да изтрий!",
                closeOnConfirm: false
            }, function () {
                db.remove_partner(partner);
                swal("Ок", "Записът е успешно изтрит", "success");
            });

        }


        pc.save_partner = function () {
            if (!pc.is_edit)
                db.add_partner(pc.partner);
            else
                db.update_partner(pc.partner);

            pc.partner = {};
            pc.is_edit = false;
            pc.isNavCollapsed = false;
        };
    })

    .controller('deliveryCtrl', function ($scope, $location, db, $timeout, globalConfig, growlService, $filter, $firebaseArray) {

        var st = this;

        st.part_products = db.getProducts();

        st.selected_index = -1;
        st.selected_art = {};
        st.result_limit = globalConfig.stockSearchLimit;
        st.temp_delivery = db.getTempDelivery();
        st.max_result = 1;
        st.getTotalDeliveryPrice = function () {
            var total = 0;
            for (var i = 0; i < st.temp_delivery.length; i++) {
                var line = st.temp_delivery[i];
                if (line.quantity && line.lastdev_price)
                    total = total + line.quantity * line.lastdev_price;

            }
            return total;
        }
        st.getTotalSalesPrice = function () {
            var total = 0;
            for (var i = 0; i < st.temp_delivery.length; i++) {
                var line = st.temp_delivery[i];
                if (line.quantity && line.price)
                    total = total + st.temp_delivery[i].quantity * st.temp_delivery[i].price;
                console.log(total + " prodajna");
            }
            return total;
        }

        st.addLine = function (art) {
            console.log(st.selected_art);
            if (angular.isDefined(art))
                st.selected_art = art;
            st.selected_art.art_id = st.selected_art.$id;
            console.log(st.selected_art);

            st.temp_delivery.$add(st.selected_art);
            st.search_part = "";
            $timeout(function () {
                angular.element('#line-0').focus();
            }, 0);
            //angular.element('#delivery-search').focus();
            st.selected_index = -1;
        }
        st.submit_line = function () {
            angular.element('#delivery-search').focus();
        }
        st.mark_row = function (art, index, lenght) {

            if (st.selected_index == index) {
                st.max_result = lenght;
                st.selected_art = art;
                return true;
            }


        }

        st.clearTempDelivery = function () {

            swal({
                title: "Сигурни ли сте?",
                text: "Набраното до момента ще бъде загубено",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#F44336",
                confirmButtonText: "Да изтрий!",
                closeOnConfirm: false
            }, function () {
                db.removeTempDelivery();
                st.selected_art = {};
                swal("Ок", "Успешно изтрит", "success");
            });


        }


        st.saveDelivery = function () {
            db.finishDelivery(st.temp_delivery);
            db.removeTempDelivery();
        }


        st.shortcuts = function (event) // Функция за обработка на стрелките и ЕНТЕР в ПОС-а 38 горна стрелка / 40 долна стрелка / 13 ЕНТЕР / 27 еск
        {
            switch (event.keyCode) {
                case 38:
                    event.preventDefault();
                    if (st.selected_index > 0)
                        st.selected_index--;
                    break;
                case 40:
                    event.preventDefault();
                    if (st.selected_index < st.max_result - 1)
                        st.selected_index++;
                    break;
                case 106:
                    event.preventDefault();
                case 13:
                    if (st.selected_index != -1) {
                        event.preventDefault();
                        st.addLine();
                        st.selected_index = -1;
                    }
                    break;
                case 27:
                    angular.element('#delivery-search').focus();
                    st.selected_index = -1;
                    break;
                default:
                    st.selected_index = -1;
            }
        }
    })

    .controller('salesReportController', function (db, $scope, $uibModal, growlService, globalConfig, ngTableParams, tableService, $filter) {


        $scope.limit = globalConfig.salesReportLimit;
        $scope.sales = [];
        $scope.availableNext = false;
        $scope.availablePrev = false;
        $scope.modalContent = [];

        //Create Modal
        function modalInstances(animation, size, backdrop, keyboard) {
            var modalInstance = $uibModal.open({
                animation: animation,
                templateUrl: 'showSale.html',
                controller: 'ModalSalesInstanceCtrl',
                size: size,
                backdrop: backdrop,
                keyboard: keyboard,
                resolve: {
                    content: function () {
                        return $scope.modalContent; // ПРоменливата която се резолва в инстанцията на диалога и е достъпна там
                    }
                }

            });
        }

        //Custom Sizes
        $scope.open = function (size) {
            modalInstances(true, size, true, true)
        }
        //Without Animation
        $scope.openWithoutAnimation = function () {
            modalInstances(false, '', true, true)
        }
        //Prevent Outside Click
        $scope.openStatic = function () {
            modalInstances(true, '', 'static', true)
        };
        //Disable Keyboard

        $scope.loadSale = function (id) {
            $scope.current_sale = db.loadSale(id);
            $scope.current_sale.$loaded().then(function () {
                $scope.modalContent = $scope.current_sale[0].order; // Предаваме текущата продажба към диалога
                $scope.openStatic();

                //console.log($scope.current_sale);
            })
        };
        $scope.getSales = function (from, to) {


            if (angular.isUndefined(from)) {
                from = new Date();
                from = new Date(from).getTime() - 24 * 60 * 60 * 60;
            }
            else
                from = new Date(from).getTime();

            if (angular.isUndefined(to)) {
                to = new Date();
                to = new Date(to).getTime() + 24 * 60 * 60 * 60;
            }
            else
                to = new Date(to).getTime();
            console.log(from + "/" + to);
            var first = db.getFirstRecord(from, to);
            first.$loaded().then(function () {
                if (angular.isDefined(first[0])) {
                    $scope.first = first[0].$id;
                    $scope.st_first = $scope.first;
                    var last = db.getLastRecord(from, to);
                    last.$loaded().then(function () {
                        $scope.last = last[0].$id;
                        $scope.st_last = $scope.last;
                        $scope.sales = db.getLastSales($scope.first, $scope.last, $scope.limit);
                        $scope.sales.$loaded().then(function () {
                            console.log($scope.sales.length - $scope.limit);
                            if ($scope.sales.length == $scope.limit)
                                $scope.availableNext = true;
                            $scope.first = $scope.sales[$scope.sales.length - 1].$id;
                        })
                    })
                }
                else {
                    growlService.growl("Няма данни за посочения период", 'danger');
                }
            })
        };

        $scope.nextSales = function () {
            $scope.availablePrev = true;
            $scope.last = $scope.st_last;
            console.log($scope.first + " / " + $scope.last);
            $scope.sales = db.getLastSales($scope.first, $scope.last, $scope.limit);
            $scope.sales.$loaded().then(function () {
                $scope.first = $scope.sales[$scope.sales.length - 1].$id;
                if ($scope.sales.length != $scope.limit)
                    $scope.availableNext = false;
            })
        };
        $scope.prevSales = function () {
            $scope.availableNext = true;
            $scope.first = $scope.st_first;
            console.log($scope.first + " / " + $scope.last);
            $scope.sales = db.getLastSales($scope.first, $scope.last, -$scope.limit);
            $scope.sales.$loaded().then(function () {
                $scope.last = $scope.sales[0].$id;
                if ($scope.sales.length != $scope.limit)
                    $scope.availablePrev = false;
            })
        };


        $scope.today = function () {
            $scope.dt = new Date();
        };
        $scope.today();


        $scope.toggleMin = function () {
            $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();

        $scope.open = function ($event, opened) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope[opened] = true;
        };
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[2];
    })
    .controller('ModalSalesInstanceCtrl', function ($scope, $modalInstance, content) {
        $scope.modalContent = content;
        $scope.ok = function () {
            $modalInstance.close();
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })


    .directive('myRepeatDirective', function () {
        return function (scope, element, attrs) {//Скролира до дъното след обавянето на ред от ng-repeat
            // console.log(attrs);
            if (scope.$last) {
                var elem = document.getElementById('pos-table');
                elem.scrollTop = elem.scrollHeight;

            }

        };
    })




