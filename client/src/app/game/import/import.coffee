angular.module('gamEvolve.game.import', [
  'ui.bootstrap'
])

.factory 'importExportDialog', ($dialog, gameConverter, currentGame) ->
  dialog = null

  open: ->
    options =
      backdrop: true
      dialogFade: true
      backdropFade: true
      templateUrl: 'game/import/import.tpl.html'
      controller: 'ImportExportDialogCtrl'
      resolve: 
        # This object will be provided to the dialog as a dependency, and serves to communicate between the two
        liaison: ->
          {
            model: gameConverter.convertGameVersionToJson(currentGame.version)
            done: (newModel) ->
              _.extend(currentGame.version, gameConverter.convertGameVersionFromJson(newModel))
              dialog.close()
            cancel: ->
              dialog.close()
          }
    dialog = $dialog.dialog(options)
    dialog.open()


.controller 'ImportExportDialogCtrl', ($scope, liaison) ->
  $scope.gameCode = liaison.model

  $scope.done = -> liaison.done($scope.gameCode)
  $scope.cancel = -> liaison.cancel()