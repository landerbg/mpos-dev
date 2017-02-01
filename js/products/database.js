/**
 * Created by Lander on 29.01.2016.
 */
"use strict";
materialAdmin

    // Сървъз в който се пази избрания артикул за редакция

    .service('product_service', function () {
        var selected_product = {};
        return {
            get_product: function () {
                return selected_product;
            },
            set_product: function (product) {
                selected_product = product;
            }
        };

    })

    .service('db', function ($firebaseArray, $firebaseObject, $rootScope, $state, growlService, $localStorage) {
        var config = {
            apiKey: "AIzaSyCBCcfvSQWeh2ikw7n30rRPV1tAInp_Q84",
            authDomain: "testpos.firebaseapp.com",
            databaseURL: "https://testpos.firebaseio.com",
            storageBucket: "firebase-testpos.appspot.com",
            messagingSenderId: "289103428353"
        };
        firebase.initializeApp(config);

        var products = [];
        var barcodes = {};
        var measures = [];
        var currency = [];
        var user = {};
        var groups = [];
        var day_info = {};
        var partners = [];
        var temp_delivery = [];
        var storage = $localStorage;
        var sales = [];

        storage.pending_orders = [];
        $rootScope.online = 0;

        return {

            clearDb: function () {
                var ref = firebase.database().ref($rootScope.uid);
                products.$destroy();
                barcodes.$destroy();
                measures.$destroy();
                currency.$destroy();
                groups.$destroy();
                partners.$destroy();
                temp_delivery.$destroy();
                $rootScope.is_auth = false; //Разлогвам

            },

            getPosDb: function () {   //ПО ГОЛЕМИТЕ ВЪЗЛИ СЕ ТЕГЛЯТ ПРИ ЗАРЕЖДАНЕ НА ПОС ИЛИ СЪОТВЕТНИЯ МОДУЛ
                //МОЖЕ БИ ТРЯБВА ДА СЕ НАПРАВЯТ НА ОТДЕЛНИ ФУНКЦИИ

                var ref = firebase.database().ref($rootScope.uid);

            },

            getDb: function () {
                //ВЗИМА ОСНОВНИТЕ ДАННИ
                //ВИКА СЕ ПРИ ЛОГИН

                var ref = firebase.database().ref($rootScope.uid);
                var now = new Date();
                var day = ("0" + now.getDate()).slice(-2);
                var month = ("0" + (now.getMonth() + 1)).slice(-2);
                var today = now.getFullYear() + "-" + (month) + "-" + (day);
                user = $firebaseObject(ref.child("user"));
                groups = $firebaseArray(ref.child("categories").orderByChild('name'));
                currency = $firebaseArray(ref.child("currency"));
                measures = $firebaseArray(ref.child("measures"));
                day_info = $firebaseObject(ref.child("qorders").child(today));
                temp_delivery = $firebaseArray(ref.child("temp_delivery"));
                user.$loaded().then(function () {
                    growlService.growl('Базата данни е заредена успешно!', 'success');

                })
                products = $firebaseArray(ref.child("products").orderByChild('number'));
                barcodes = $firebaseObject(ref.child("barcodes"));
                partners = $firebaseArray(ref.child("partners"));
                products.$loaded().then(function () {

                    growlService.growl('Базата данни за продажби е  заредена успешно!', 'success');
                    $state.go("home");
                })
            },
            getUser: function () {

                return user;
            },
            getProducts: function () {
                return products;
            },
            getBarcodes: function () {
                return barcodes;
            },
            getCurrency: function () {
                return currency;
            },
            getMeasures: function () {
                return measures;
            },
            getGroups: function () {
                return groups;
            },
            getDayInf: function () {
                return day_info;
            },
            getPartners: function () {
                return partners;
            },
            getTempDelivery: function () {
                return temp_delivery;
            },
            getFirstRecord: function (from, to) {
                var ref = firebase.database().ref($rootScope.uid);
                return $firebaseArray(ref.child('h_orders').orderByChild('date').startAt(from).endAt(to).limitToFirst(1));
            },
            getLastRecord: function (from, to) {
                var ref = firebase.database().ref($rootScope.uid);
                return $firebaseArray(ref.child('h_orders').orderByChild('date').startAt(from).endAt(to).limitToLast(1));
            },
            getLastSales: function (first, last, limit) {
                console.log(first + ' / ' + last);
                var ref = firebase.database().ref($rootScope.uid);
                if (limit > 0)
                    return $firebaseArray(ref.child('h_orders').orderByKey().startAt(first).endAt(last).limitToFirst(limit));
                else
                    return $firebaseArray(ref.child('h_orders').orderByKey().startAt(first).endAt(last).limitToLast(-limit));

            },
            loadSale: function (id) {
                var ref = firebase.database().ref($rootScope.uid);
                return $firebaseArray(ref.child('orders').orderByKey().equalTo(id));
            },

            finishOrder: function (order, qorder) {
                var ref = firebase.database().ref($rootScope.uid);

                var object = {
                    'order': order,
                    'qorder': qorder
                }
                storage.pending_orders.push(object); //Запис на поръчката в случай че сме офлайн
                $rootScope.online++;
                var now = new Date();
                var day = ("0" + now.getDate()).slice(-2);
                var month = ("0" + (now.getMonth() + 1)).slice(-2);
                var today = now.getFullYear() + "-" + (month) + "-" + (day);

                var temp = ref.child('orders').push({
                    date: firebase.database.ServerValue.TIMESTAMP,
                    order: order
                }, function () {
                    var tempid = temp.key;
                    ref.child('h_orders').push({
                        date: firebase.database.ServerValue.TIMESTAMP,
                        id: tempid,
                        total: qorder.total
                    });
                    $rootScope.online--;
                    var index = storage.pending_orders.indexOf(object);
                    storage.pending_orders.splice(index, 1); // Трие поръчката от локал сторидж при успешен запис в базата

                    ref.child('qorders').child(today).child('total').transaction(function (q) {
                        console.log("Добавям към тотала" + qorder.total);
                        return (q || 0) + qorder.total;
                    });
                    ref.child('qorders').child(today).child('profit').transaction(function (q) {
                        console.log("Добавям към печалбата" + qorder.profit);
                        return (q || 0) + qorder.profit;
                    });
                    ref.child('qorders').child(today).child('sales_count').transaction(function (q) {
                        console.log("Добавям към брой сметки");
                        return (q || 0) + 1;
                    });
                    for (var i = 0; i < order.length; i++) {
                        ref.child('products').child(order[i].art_id).child('qty').transaction(function (qty) {
                            console.log('Бяха ' + qty);
                            console.log('Намалени ' + order[i].ammount + ' !');
                            return qty - parseFloat(order[i].ammount);
                        })

                    }
                });


                // console.log(order.products);

            },

            finishDelivery: function (delivery) {

                var delivery2 = [];
                for (var i = 0; i < delivery.length; i++) {
                    delete delivery[i].$id;
                    delete delivery[i].$priority;
                    delivery2[i] = delivery[i];
                }

                var ref = firebase.database().ref($rootScope.uid);
                ref.child('deliveries').push({
                    date: firebase.database.ServerValue.TIMESTAMP,
                    delivery: delivery2
                }, function () {
                    for (var i = 0; i < delivery2.length; i++) {
                        ref.child('products').child(delivery2[i].art_id).child('lastdev_price').set(parseFloat(delivery2[i].lastdev_price));
                        ref.child('products').child(delivery2[i].art_id).child('qty').transaction(function (qty) {
                            return qty + parseFloat(delivery2[i].quantity);
                        })

                    }
                });


                // console.log(order.products);

            },

            //Манипулирне на баркодовете
            //Манипулирне на баркодовете
            //Манипулирне на баркодовете
            //Манипулирне на баркодовете

            delBarcode: function (id) {

                delete barcodes[id];
                barcodes.$save().then(function (value) {
                    console.log("Изтри баркод към артикул" + id + '///   ' + value);

                }).
                    catch(function (err) {
                        console.log("Проблем със изтриването на баркод" + err);
                    })

            },
            addBarcode: function (key, value) {

                barcodes[key] = value;
                barcodes.$save().then(function (value) {
                    console.log("Добавен баркод" + value);

                }).
                    catch(function (err) {
                        console.log("Проблем с добавяне на баркод" + err);
                    })
                console.log(barcodes);
            },


            //Манипулирне на продуктите
            //Манипулирне на продуктите
            //Манипулирне на продуктите
            //Манипулирне на продуктите
            add_product: function (product) {

                if (product.lastdev_price)
                    product.lastdev_price = parseFloat(product.lastdev_price);
                if (product.avgdev_price)
                    product.avgdev_price = parseFloat(product.avgdev_price);
                product.price = parseFloat(product.price);
                product.qty = 0;
                products.$add(product).then(function (value) {
                    console.log("Добавен е продукт" + value);

                }).
                    catch(function (err) {
                        console.log("Проблем с добавяне на продукт" + err);
                    })

            },
            remove_product: function (product) {

                products.$remove(product).then(function (value) {
                    console.log("Изтри артикул" + value);
                    for (var k in barcodes) {
                        if (product.$id == barcodes[k])
                            delete barcodes[k];

                    }
                    barcodes.$save().then(function (value) {
                        console.log("Изтрити баркодdoве" + value);

                    }).
                        catch(function (err) {
                            console.log("Проблем с изтриването на баркодове" + err);
                        })
                    console.log("success" + value);

                }).
                    catch(function (err) {
                        console.log("Проблем с итриването на артикула" + err);
                    })

            },
            update_product: function (product) {
                product.lastdev_price = parseFloat(product.lastdev_price);
                product.avgdev_price = parseFloat(product.avgdev_price);
                product.price = parseFloat(product.price);
                products.$save(product).then(
                    function (value) {
                        console.log("Продуктът е променен" + value)
                    }).
                    catch(function (e) {
                        console.log("Проблем с ъпдейт на продукт" + e);
                    })
            },


            //Манипулирне на мерни единици


            add_measure: function (measure) {


                measures.$add(measure).then(function (value) {
                    console.log("Добавена е мерна единица" + value);

                }).
                    catch(function (err) {
                        console.log("Проблем с добавяне на мерна единицат" + err);
                    })

            },
            update_measure: function (measure) {

                measures.$save(measure).then(
                    function (value) {
                        console.log("Записът е променен" + value)
                    }).
                    catch(function (e) {
                        console.log("Проблем с ъпдейт на запис" + e);
                    })
            },

            remove_measure: function (measure) {

                measures.$remove(measure).
                    catch(function (err) {
                        console.log("Проблем с итриването на артикула" + err);
                    })

            },


            add_partner: function (partner) {


                partners.$add(partner).then(function (value) {
                    console.log("Добавен е партньор" + value);

                }).
                    catch(function (err) {
                        console.log("Проблем с добавяне на партньор" + err);
                    })

            },
            update_partner: function (partner) {

                partners.$save(partner).then(
                    function (value) {
                        console.log("Записът е променен" + value)
                    }).
                    catch(function (e) {
                        console.log("Проблем с ъпдейт на запис" + e);
                    })
            },

            remove_partner: function (partner) {

                partners.$remove(partner).
                    catch(function (err) {
                        console.log("Проблем с итриването на партньора" + err);
                    })

            },
            removeTempDelivery: function () {

                firebase.database().ref($rootScope.uid).child('temp_delivery').remove().
                    catch(function (err) {
                        console.log("Проблем с итриването на доставката" + err);
                    })

            }
        }

    })


