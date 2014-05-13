
angular.module('gamEvolve.model.chips', [])


.factory 'chips', (currentGame) ->

  getType: (chip) ->
    return "null" unless chip
    if "switch" of chip then "switch"
    else if "processor" of chip then "processor"
    else if "emitter" of chip then "emitter"
    else if "splitter" of chip then "splitter"
    else "unknown"

  acceptsChildren: (chip) ->
    return false unless chip
    if chip.switch or chip.processor or chip.splitter
      if not chip.children
        chip.children = []
      true
    else
      false

  hasChildren: (chip) ->
    return chip && chip.children && chip.children.length > 0

  isRoot: (chip) ->
    return currentGame.version && currentGame.version.board is chip