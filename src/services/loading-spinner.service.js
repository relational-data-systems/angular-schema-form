(function () {
  'use strict';

  angular
    .module('schemaForm')
    .service('LoadingSpinnerService', LoadingSpinnerService);

  LoadingSpinnerService.$inject = ['$log', '$sce', '$animate', '$http', '$q', '$timeout'];

  /* @ngInject */
  function LoadingSpinnerService ($log, $sce, $animate, $http, $q, $timeout) {
    var DELAY_TO_REMOVE = 500;

    var spinnerOverlayTemplateSmall = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-sm"></div></div></div>';
    var spinnerOverlayTemplateMiddle = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-md"></div></div></div>';
    var spinnerOverlayTemplateLarge = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-lg"></div></div></div>';

    // Angular tempaltes that have access to sf-field scope can use these pre-defined loading spinner
    // overlays to cover a exact component in these templates:
    // 1. Use <div ng-show="form.httpPending" ng-bind-html="spinnerOverlayHtmlSmall|Middle|Large"></div>
    //    beside the exact component we want to cover.
    // 2. Use <div class="rds-spinner-container"></div> to enclose both the component and the overlay
    //    elements we just added.
    // Example: rds-dynamic-single-select.html, rds-dynamic-multi-select.html
    this.spinnerOverlayHtmlSmall = $sce.trustAsHtml(spinnerOverlayTemplateSmall);
    this.spinnerOverlayHtmlMiddle = $sce.trustAsHtml(spinnerOverlayTemplateMiddle);
    this.spinnerOverlayHtmlLarge = $sce.trustAsHtml(spinnerOverlayTemplateLarge);

    var spinnerOverlayElementSmall = angular.element(spinnerOverlayTemplateSmall);
    var spinnerOverlayElementMiddle = angular.element(spinnerOverlayTemplateMiddle);
    var spinnerOverlayElementLarge = angular.element(spinnerOverlayTemplateLarge);

    this.addSpinnerOverlay = addSpinnerOverlay;
    this.removeSpinnerOverlay = removeSpinnerOverlay;
    this.httpWithSpinner = httpWithSpinner;

    var _elemId2Spinner = {};

    function _getUniqueId (targetElement) {
      // Maybe there can be a better way to get a unique id ..?
      targetElement.uniqueId();
      return targetElement.prop('id');
    }

    function addSpinnerOverlay (spinnerSize, targetElement) {
      var spinnerOverlayElement = _getSpinnerOverlayElement(spinnerSize);
      if (spinnerOverlayElement) {
        var elementId = _getUniqueId(targetElement);
        if (!_elemId2Spinner[elementId]) {
          // Add this if judgement in case of multiple http calls bring in more than
          // one spinning overlays.
          _elemId2Spinner[elementId] = spinnerOverlayElement;
          $animate.enter(spinnerOverlayElement, targetElement);
        }
      }
    }

    function removeSpinnerOverlay (targetElement) {
      var uniqueId = _getUniqueId(targetElement);
      var spinnerOverlayElement = _elemId2Spinner[uniqueId];
      if (spinnerOverlayElement) {
        $animate.leave(spinnerOverlayElement, targetElement);
        delete _elemId2Spinner[uniqueId];
      }
    }

    /**
     * @param {Object} httpParams params to pass to the $http service
     * @param {Object} form The form from angular schema form to put the "httpPending" flag on during the http call
     * @param {Object} overlayConfig {spinnerSize: 'sm|md|lg', element: jQlite}
     * @return {Promise}
     */
    function httpWithSpinner (httpParams, form, overlayConfig) {
      return $q(function (resolve, reject) {
        if (form) {
          form.httpPending = true;
        }
        if (_isValidOverlayConfig(overlayConfig)) {
          addSpinnerOverlay(overlayConfig.spinnerSize, overlayConfig.element);
        }

        $http(httpParams)
          .then(function (response) {
            _resetPendingFlagAndSpinner();
            resolve(response);
          }, function (error) {
            _resetPendingFlagAndSpinner();
            reject(error);
          });

        function _resetPendingFlagAndSpinner () {
          $timeout(function () {
            if (form) {
              form.httpPending = false;
            }
            if (_isValidOverlayConfig(overlayConfig)) {
              removeSpinnerOverlay(overlayConfig.element);
            }
          }, DELAY_TO_REMOVE);
        }
      });
    }

    function _isValidOverlayConfig (overlayConfig) {
      return overlayConfig && overlayConfig.spinnerSize && overlayConfig.element;
    }

    function _getSpinnerOverlayElement (spinnerSize) {
      var spinnerOverlayElement = null;
      if (spinnerSize) {
        switch (spinnerSize) {
          case 'sm':
            spinnerOverlayElement = spinnerOverlayElementSmall;
            break;
          case 'md':
            spinnerOverlayElement = spinnerOverlayElementMiddle;
            break;
          case 'lg':
            spinnerOverlayElement = spinnerOverlayElementLarge;
            break;
        }
      }
      return spinnerOverlayElement !== null ? angular.copy(spinnerOverlayElement) : null;
    }
  }
})();
