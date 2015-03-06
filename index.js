//@TODO github module

var immutable = require('immutable')

module.exports = Index

function Index(chunk, opts){
  opts = opts || {}
  opts.cursorTranslator = opts.cursorTranslator || function(cursor){return cursor}

  this.opts = opts
  this.set(chunk)
  this._frozen = {front: false, back: false}
}

Index.prototype.set = function(chunk){
  this.list = immutable.List(chunk)
  this.cursors = immutable.List([_rangeFromChunk(this.list)])
  return this
}

Index.prototype.asList = function(){ return this.list }
Index.prototype.asArray = function(){ return this.asList().toArray() }
//@TODO list with seperators, other getters

Index.prototype.freezeBack = function(){ this._frozen.back = true; return this }
Index.prototype.freezeFront = function(){ this._frozen.front = true; return this }
Index.prototype.unfreezeBack = function(){ this._frozen.back = false; return this }
Index.prototype.unfreezeFront = function(){ this._frozen.front = false; return this }

Index.prototype.isBackFrozen = function(){ return this._frozen.back }
Index.prototype.isFrontFrozen = function(){ return this._frozen.front }

Index.prototype.getBackmostCursor = function(){ return this._translateCursor(this.cursors.last()[1] || null) }
Index.prototype.getFrontmostCursor = function(){ return this._translateCursor(this.cursors.first()[0] || null) }
Index.prototype.getFirstBackCursor = function(){ return this._translateCursor(this.cursors.first()[1] || null) }
Index.prototype.getLastFrontCursor = function(){ return this._translateCursor(this.cursors.last()[0] || null) }
Index.prototype.getCursors = function(){
  var self = this
  return this.cursors.map(function(range){
    return [self._translateCursor(range[0]), self._translateCursor(range[1])]
  })
}

function _rangeFromChunk(chunk){
  return [chunk.get(0), chunk.last()]
}

Index.prototype._translateCursor = function(cursor){
  return this.opts.cursorTranslator(cursor)
}

/*
  prepend - list: add chunk to front. cursors: merge range into front cursor
  append - list: add chunk to back. cursors: merge range into back cursor
  unshift - list: add chunk to front. cursors: unshift range onto cursor set
  push - list: add chunk to back. cursors: push range onto cursor set
  */

Index.prototype.prepend = function(chunk){
  if(typeof chunk === 'string'){ chunk = [chunk] }
  this.addChunk(chunk, {mergeOverlap: false, mergeEndpoint: true, position: 'front'})
  return this
}

Index.prototype.append = function(chunk){
  if(typeof chunk === 'string'){ chunk = [chunk] }
  this.addChunk(chunk, {mergeOverlap: false, mergeEndpoint: true, position: 'back'})
  return this
}

Index.prototype.unshift = function(chunk){
  if(typeof chunk === 'string'){ chunk = [chunk] }
  this.addChunk(chunk, {mergeOverlap: false, mergeEndpoint: false, position: 'front'})
  return this
}

Index.prototype.push = function(chunk){
  if(typeof chunk === 'string'){ chunk = [chunk] }
  this.addChunk(chunk, {mergeOverlap: false, mergeEndpoint: false, position: 'back'})
  return this
}

/*
  merge - merge chunk and cursors into existing.
  @type: the default operation (see above) if no overlapping ranges
  */
Index.prototype.merge = function(type, chunk){
  if(typeof chunk === 'string'){ chunk = [chunk] }
  if(type === 'unshift'){ opts = {mergeOverlap: true, mergeEndpoint: false, position: 'front'} }
  if(type === 'push'){ opts = {mergeOverlap: true, mergeEndpoint: false, position: 'back'} }
  if(type === 'prepend'){ opts = {mergeOverlap: true, mergeEndpoint: true, position: 'front'} }
  if(type === 'append'){ opts = {mergeOverlap: true, mergeEndpoint: true, position: 'back'} }
  this.addChunk(chunk, opts)
  return this
}

Index.prototype.addChunk = function(chunk, opts){
  //@TODO enforce opts schema
  if(typeof opts.mergeEndpoint !== 'boolean' || typeof opts.mergeOverlap !== 'boolean' || ['back', 'front'].indexOf(opts.position) === -1){ throw new Error('missing merge or position options in addChunk') }

  //if list size is zero, just set the values and return
  if(this.list.size === 0){
    this.set(chunk)
    return this
  }

  var self = this
  var chunk = immutable.List(chunk)
  var range = _rangeFromChunk(chunk)

  var removeList = opts.mergeOverlap ? chunk.skip(1).butLast() : chunk
  //@TODO better to foreach on chunk or filter on this.list?
  removeList.forEach( function(ID) {
    var io = self.list.indexOf(ID)
    if(io !== -1){
      self.cursors.forEach(function(range, index){
        //If this is a 1 count range and they hit the ID, delete range
        if(range[0] === ID && range[1] === ID){
          self.cursors = self.cursors.delete(index)
          return false
        }
        if(range[0] === ID){
          var next = self.list.get(io+1)
          self.cursors = self.cursors.set(index, [next, range[1]])
          return false
        }
        if(range[1] === ID){
          var prev = self.list.get(io-1)
          self.cursors = self.cursors.set(index, [range[0], prev])
          return false
        }
      })
      self.list = self.list.delete(io)
    }
  })

  //after cleanup check list size again and if 0, just set the values and return
  if(this.list.size === 0){
    this.set(chunk)
    return this
  }

  if(opts.mergeOverlap === false){ this._endpointMerge(chunk, opts) }
  else{ this._merge(chunk, opts) }
}

Index.prototype._endpointMerge = function(chunk, opts){
  var newRange = _rangeFromChunk(chunk)
  if(opts.position === 'front'){
    this.list = chunk.concat(this.list)
    if(opts.mergeEndpoint === true){ this.cursors = this.cursors.update(0, function(range){ return [newRange[0], range[1]] }) }
    else{ this.cursors = this.cursors.unshift(newRange) }
  }
  else if(opts.position === 'back'){
    this.list = this.list.concat(chunk)
    if(opts.mergeEndpoint === true){ this.cursors = this.cursors.update(-1, function(range){ return [range[0], newRange[1]] }) }
    else{ this.cursors = this.cursors.push(newRange) }
  }
}

Index.prototype._merge = function(chunk, opts){
  var self = this
  var range = _rangeFromChunk(chunk)

  var ioStart = this.list.indexOf(range[0])
  var ioEnd = this.list.indexOf(range[1])

  if(ioStart === -1 && ioEnd === -1){
    if(opts.position === 'front'){ this.list = chunk.concat(this.list) }
    else if(opts.position === 'back'){ this.list = this.list.concat(chunk) }
  }
  else{
    var ioInsert = ioStart !== -1 ? ioStart : ioEnd
    var count = 1 + ((ioStart === -1 || ioEnd === -1) ? 0 : ioEnd - ioStart)
    this.list = this.list.splice.apply(this.list, [ioInsert, count].concat(chunk.toArray()))
  }

  function mergeRange(newRange, index) {
    var rangeStart = self.list.indexOf(newRange[0])
    var rangeEnd = self.list.indexOf(newRange[1])
    var compare = self.cursors.get(index)
    var compareStart = compare && self.list.indexOf(compare[0])
    var compareEnd = compare && self.list.indexOf(compare[1])

    if(!compare || rangeEnd < compareStart){
      if(self.isFrontFrozen()){ throw new Error('trying to append to front of index which is frozen') }
      //if this is the first index, we are unshifting, and merge is true, merge into the first range
      if(compare && index === 0 && opts.mergeEndpoint === true){ self.cursors = self.cursors.set(0, [newRange[0], compare[1]]) }
      else{ self.cursors = self.cursors.splice(index, 0, newRange) }
      return true
    }
    if(rangeStart <= compareEnd || compareEnd === -1 || compareStart === -1){
      //If the start is before the comparable end, merge the cursors and delete the existing ref
      var merged = [ (rangeStart < compareStart ? newRange[0] : compare[0]), (rangeEnd > compareEnd ? newRange[1] : compare[1]) ]
      self.cursors = self.cursors.delete(index)
      mergeRange(merged, index)
    }
    else{
      //if this is the last cursor and we did not merge, push
      if(index === self.cursors.size-1){
        if(self.isBackFrozen()){ throw new Error('trying to append to back of index which is frozen') }
        //if merge is true, merge into the last range
        if(opts.mergeEndpoint === true){ self.cursors = self.cursors.set(0, [compare[0], newRange[1]]) }
        else{ self.cursors = self.cursors.push(newRange) }
        return true
      }
      //else recurse down index
      else{ mergeRange(newRange, index+1) }
    }
  }

  mergeRange(range, 0)
}
