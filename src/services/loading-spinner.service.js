(function() {
  'use strict';

  angular
    .module('schemaForm')
    .service('LoadingSpinnerService', LoadingSpinnerService);

  LoadingSpinnerService.$inject = ['$log', '$sce', '$animate', '$http', '$q', '$timeout'];

  /* @ngInject */
  function LoadingSpinnerService($log, $sce, $animate, $http, $q, $timeout) {

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

    function addSpinnerOverlay(spinnerSize, targetElement) {
      var spinnerOverlayElement = _getSpinnerOverlayElement(spinnerSize);
      if (spinnerOverlayElement) {
        $animate.enter(spinnerOverlayElement, targetElement);
      }
    }

    function removeSpinnerOverlay(spinnerSize, targetElement) { //TODO: remove the first parameter
      var spinnerOverlayElement = _getSpinnerOverlayElement(spinnerSize);
      if (spinnerOverlayElement) {
        $animate.leave(spinnerOverlayElement, targetElement);
      }
    }

    /**
     * @param {Object} httpParams params to pass to the $http service
     * @param {Object} form The form from angular schema form to put the "httpPending" flag on during the http call
     * @param {Object} overlayConfig {spinnerSize: 'sm|md|lg', element: jQlite}
     * @return {Object} a form field defintion
     */
    function httpWithSpinner(httpParams, form, overlayConfig) {
      return $q(function(resolve, reject) {
        if (form) {
          form.httpPending = true;
        }
        if (overlayConfig) {
          addSpinnerOverlay(overlayConfig.spinnerSize, overlayConfig.element);
        }

        $http(httpParams)
          .then(function(response) {
            _resetPendingFlagAndSpinner();
            resolve(response);
          }, function(error) {
            _resetPendingFlagAndSpinner();
            reject(error);
          });

        function _resetPendingFlagAndSpinner() {
          $timeout(function() {
            if (form) {
              form.httpPending = false;
            }
            if (overlayConfig) {
              removeSpinnerOverlay(overlayConfig.spinnerSize, overlayConfig.element);
            }
          }, 500);
        }
      }) 
    }

    function _getSpinnerOverlayElement(spinnerSize) {
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
      return spinnerOverlayElement;
    }

  }
})();