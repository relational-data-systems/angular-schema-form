(function() {
  'use strict';

  angular
    .module('schemaForm')
    .service('LoadingSpinnerService', LoadingSpinnerService);

  LoadingSpinnerService.$inject = ['$log', '$sce', '$animate'];

  /* @ngInject */
  function LoadingSpinnerService($log, $sce, $animate) {

    var spinnerOverlayTemplateSmall = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-sm"></div></div></div>';
    var spinnerOverlayTemplateMiddle = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-md"></div></div></div>';
    var spinnerOverlayTemplateLarge = '<div class="rds-spinner-overlay"><div class="vertical-align-wrapper"><div class="rds-spinner-icon-lg"></div></div></div>';

    this.spinnerOverlayHtmlSmall = $sce.trustAsHtml(spinnerOverlayTemplateSmall);
    this.spinnerOverlayHtmlMiddle = $sce.trustAsHtml(spinnerOverlayTemplateMiddle);
    this.spinnerOverlayHtmlLarge = $sce.trustAsHtml(spinnerOverlayTemplateLarge);

    var spinnerOverlayElementSmall = angular.element(spinnerOverlayTemplateSmall);
    var spinnerOverlayElementMiddle = angular.element(spinnerOverlayTemplateMiddle);
    var spinnerOverlayElementLarge = angular.element(spinnerOverlayTemplateLarge);

    this.addSpinnerOverlay = addSpinnerOverlay;
    this.removeSpinnerOverlay = removeSpinnerOverlay;

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