(function(){
    app = angular.module('form_master', [])
    app.controller('MainController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope){
        $scope.tab = 1;
        $scope.websites = {};
        $scope.forms = [];
        $scope.editing_blur_timeout = false;

        // load data
        $http.get("/websites")
            .success(function(response){ $scope.websites = response.result; })
            .error(function(response){ alert('Failed to load websites'); })

        $http.get("/forms")
            .success(function(response){ $scope.forms = response.result })
            .error(function(response){ alert('Failed to load forms'); })

        $scope.Utils = {
            keys : Object.keys,
            values : function(obj){ var res = []; for (key in obj){ res.push(obj[key]); } return res; }
        }

        $scope.delete = function(area, item){
            if (confirm('Are you sure?')){
                $http.delete("/" + area + '/' + item.id).success(function(response) {
                    if (response.status == 'OK'){
                        delete $scope.$eval(area)[item.id]
                    }else{
                        alert(response.result)
                    }
                }).error(function(response){ alert('Failed to delete'); })
            }
        }

        $scope.quit_editing = function(area){
            $tr = $('table[area=' + area + '] tr.editing');
            $('.edit').remove();

            if ($tr.attr('item_id') == 0){
                delete $scope.$eval(area)[0];
                if(!$scope.$$phase){
                    $scope.$apply()
                }
            }else{
                $tr.removeClass('editing');
            }
        }

        $scope.edit = function(area, item){
            var $tr = $('table[area=' + area + '] tr[item_id=' + item.id + ']')

            if ($tr.hasClass('editing')) return;

            $tr.addClass('editing');

            $tr.find('td.ng-binding').each(function(i, td){
                var $td = $(td);
                var field = $td.attr('field')
                var dest = $(td).offset();
                var params = 'class="edit" original_value="' + $td.text() + '" ' + $td.attr('required') + ' field="' + $td.attr('field') + '"';

                switch ($td.attr('type')){
                    case 'text':
                        var e = $('<input type="text" value="' + $td.text() + '" ' + params + '/>')
                        break;
                    case 'select':
                        var e = $('<select ' + params + '/>');
                        var options = $scope.$eval($td.attr('options')) || {}
                        for (key in options){
                            var selected = (item[field] == key) ? 'selected' : '';
                            e.append('<option value="' + key + '" ' + selected + '>' + options[key]['name'] + '</option>')
                        }
                        break;
                }

                e.css({top: dest.top, left: dest.left})
                $('#' + area).append(e);


                e.on('blur', function(){
                    $scope.editing_blur_timeout = setTimeout(function(){ $scope.quit_editing(area) }, 10)
                });
                e.on('focus', function(){
                    if ($scope.editing_blur_timeout){
                        clearTimeout($scope.editing_blur_timeout);
                        $scope.editing_blur_timeout = false;
                    }
                });

                if (i==0) e.focus();
                e.on('keyup', function(key){
                    if (key.keyCode == 27){
                        // ESC
                        $scope.quit_editing(area);
                        return true;
                    }

                    if (key.keyCode !== 13){
                        return true;
                    }

                    try{
                        $('.required').removeClass('required');

                        var data = {}
                        $('#' + area + ' .edit').each(function(i, e){
                            var $e  = $(e);
                            if ($e.attr('required') && $e.val() == ''){
                                $e.addClass('required').focus()
                                throw ['Field is required', $td]
                            }
                            data[$e.attr('field')] = $e.val()
                        });
                        if (item.id == 0){
                            // add new
                            $http.post('/' + area + '/', data).success(function(response){
                                if (response.status == 'OK'){
                                    item.id = response.result

                                    $scope.quit_editing(area)
                                    $.extend(item, data)
                                    $scope.$eval(area)[item.id] = item
                                }else{
                                    alert('Could not add')
                                }
                            })
                        }else{
                            // update existent
                            $http.put('/' + area + '/' + item.id, data).success(function(response){
                                if (response.status == 'OK'){
                                    $scope.quit_editing(area)
                                    $.extend(item, data)
                                }else{
                                    alert('Could not save changes')
                                }
                            })
                        }
                    }catch(e){
                        console.log(e);
                    }
                })
            })
        }

        $scope.add = function(area){
            if ($('table[area=' + area + '] tr[item_id=0]').length){
                return;
            }
            var item = {'id': 0}
            $scope.$eval(area)[0] = item;
            $scope.$eval(area + '_filter=""');
            setTimeout(function(){ $scope.edit(area, item) }, 1)
        }

        $scope.edit_form = function(form){
            $rootScope.$emit('edit_form_open', form);
        }
    }]);

    app.config(function($httpProvider, $sceProvider) {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $sceProvider.enabled(false);
    });

    app.filter('with', function() {
      return function(items, search) {
            if (!search) return items;
            found_items = {};
            angular.forEach(items, function(item, item_id) {
                for(var key in item) {
                    if (key.indexOf('id') >= 0) continue;

                   if (item[key].indexOf(search) >= 0){
                        found_items[item_id] = item
                   }
                }
            });
            return found_items;
        };
    });

    app.controller('EditFormController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope){
        $rootScope.$on('edit_form_open', function(event, form) {
            $scope.form_name = form.name;
            $("#form_editor").modal()
        });
    }]);
})();