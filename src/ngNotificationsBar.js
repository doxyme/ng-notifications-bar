(function (root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory(root, require('angular'));
	} else if (typeof define === 'function' && define.amd) {
		define(['angular'], function (angular) {
			return (root.ngNotificationsBar = factory(root, angular));
		});
	} else {
		root.ngNotificationsBar = factory(root, root.angular);
	}
}(this, function (window, angular) {
	var module = angular.module('ngNotificationsBar', []);

	module.provider('notificationsConfig', function() {
		var config = {};

		function setHideDelay(value){
			config.hideDelay = value;
		}

		function getHideDelay(){
			return config.hideDelay;
		}

		function setAcceptHTML(value){
			config.acceptHTML = value;
		}

		function getAcceptHTML(){
			return config.acceptHTML;
		}

		function setTemplateUrl(url) {
			 config.templateUrl = url;
		}

		function getTemplateUrl() {
			return config.templateUrl;
		}

		function setAutoHide(value){
			config.autoHide = value;
		}

		function getAutoHide(){
			return config.autoHide;
		}

		function getHTMLTemplate() {
			return function (elem, attr) {
				var iconClasses = attr.closeicon || 'glyphicon glyphicon-remove';
				return '\
					<div class="notifications-container" ng-if="notifications.length">\
						<div class="{{note.type}}" ng-repeat="note in notifications">\
							<span class="message" ng-bind-html="note.message"></span>\
							<span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
						</div>\
					</div>\
				'
			}
		}

		function getTemplate() {
			return function (elem, attr) {
				var iconClasses = attr.closeicon || 'glyphicon glyphicon-remove';
				return '\
					<div class="notifications-container" ng-if="notifications.length">\
						<div class="{{note.type}}" ng-repeat="note in notifications">\
							<span class="message" >{{note.message}}</span>\
							<span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
						</div>\
					</div>\
				'
			}
		}

		return {
			setHideDelay: setHideDelay,

			setAutoHide: setAutoHide,

			setAcceptHTML: setAcceptHTML,

			setTemplateUrl: setTemplateUrl,

			$get: function(){
				return {
					getHideDelay: getHideDelay,

					getAutoHide: getAutoHide,

					getAcceptHTML: getAcceptHTML,

					getTemplateUrl: getTemplateUrl,

					getHTMLTemplate: getHTMLTemplate,

					getTemplate: getTemplate
				};
			}
		};
	});

	module.factory('notifications', ['$rootScope', function ($rootScope) {
		var showError = function (message) {
			$rootScope.$broadcast('notifications:error', message);
		};

		var showWarning = function (message) {
			$rootScope.$broadcast('notifications:warning', message);
		};

		var showSuccess = function (message) {
			$rootScope.$broadcast('notifications:success', message);
		};

		var closeAll = function () {
			$rootScope.$broadcast('notifications:closeAll');
		};

		return {
			showError: showError,
			showWarning: showWarning,
			showSuccess: showSuccess,
			closeAll: closeAll
		};
	}]);

	module.directive('compileHtml', ['$compile', function($compile) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				scope.$watch(attrs.compileHtml, function(html) {
					elem.html(html);
					$compile(elem.contents())(scope);
				});
			}
		};
	}]);

	module.directive('notificationsBar', ['notificationsConfig', '$timeout', '$window', '$rootScope', function (notificationsConfig, $timeout, $window, $rootScope) {
		var isTemplateUrl = notificationsConfig.getTemplateUrl();
		var acceptHTML = notificationsConfig.getAcceptHTML() || false;
		return {
			restrict: 'EA',
			templateUrl: notificationsConfig.getTemplateUrl() || null,
			template: isTemplateUrl ? null : acceptHTML ? notificationsConfig.getHTMLTemplate() : notificationsConfig.getTemplate(),
			link: function (scope) {
				var notifications = scope.notifications = [];
				var connectionNotification;
				var timers = [];
				var autoHideDelay = notificationsConfig.getHideDelay() || 3000;
				var autoHide = notificationsConfig.getAutoHide() || false;
				var removeById = function (id) {
					var found = -1;

					notifications.forEach(function (el, index) {
						if (el.id === id) {
							found = index;
						}
					});

					if (found >= 0) {
						notifications.splice(found, 1);
						$rootScope.$emit('notifications:closed', id);
					}
				};

				var notificationHandler = function (event, data, type) {
					var message, hide = autoHide, hideDelay = autoHideDelay;

					if (typeof data === 'object') {
						message = data.message;
						hide = (typeof data.hide === 'undefined') ? autoHide : !!data.hide;
						hideDelay = data.hideDelay || hideDelay;
					} else {
						message = data;
					}

					var id = data.id ? data.id : 'notif_' + (new Date()).getTime();
					removeById(id);
					notifications.push({id: id, type: type, message: message});
					if (hide) {
						var timer = $timeout(function () {
							removeById(id);
							$timeout.cancel(timer);
						}, hideDelay);
					}
				};

				scope.$on('notifications:error', function (event, data) {
					notificationHandler(event, data, 'error');
				});

				scope.$on('notifications:warning', function (event, data) {
					notificationHandler(event, data, 'warning');
				});

				scope.$on('notifications:success', function (event, data) {
					notificationHandler(event, data, 'success');
				});

				scope.$on('notifications:closeAll', function () {
					notifications.length = 0;
				});

				scope.close = function (index) {
					notifications.splice(index, 1);
				};
			}
		};
	}]);

	return module;
}));
