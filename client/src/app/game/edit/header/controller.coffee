
angular.module('gamEvolve.game.edit.header', [
  'gamEvolve.game.edit.header.time'
])

.controller 'GameInfoCtrl', ($scope, currentGame, gameTime) ->
    $scope.currentGame = currentGame
    $scope.gameTime = gameTime

.controller 'MenuCtrl', ($scope, $location, loggedUser, games, currentGame, loginDialog, importExportDialog) ->
    $scope.user = loggedUser
    $scope.games = games
    $scope.currentGame = currentGame
    $scope.loginDialog = loginDialog
    $scope.importExportDialog = importExportDialog
    $scope.loadGame = -> $location.path('/game/list')