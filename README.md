# indexor
Simple / flexible data structure for indexes.  

Useful for infinite loading lists, twitter style feeds, conversations, or any index where the entire index is not known upfront.  Uses immutable.js for underlying data structures, and plays nicely with flux stores.

## Usage
```js
var Index = require('indexor')

//e.g.
var index = new Index(['a', 'b'])   // ['a', 'b']
index.append(['c', 'd'])            // ['a', 'b', 'c', 'd',]
index.merge('b', 'm', 'n', 'c')     // ['a', 'b', 'm', 'n', 'c', 'd']
index.prepend([0, 1])               // [0, 1, 'a', 'b', 'm', 'n', 'c', 'd']

//overwrite some data (chunks are considered contiguous)
index.set(['a', 'b', 'c', 'd'])
index.merge(['a', 'd'])             // ['a', 'd']
//if you want to avoid deletes call append or prepend
index.set(['a', 'b', 'c', 'd'])
index.prepend(['a', 'd'])             // ['a', 'd', 'b', 'c']
```

**Simple Blog Index**
```js
var feed = new Index()
getBlogPosts(function(posts){
  var PostIDS = posts.map(function(post){return post.PostID})
  feed.append(PostIDS)
})

//later
getMoreBlogPosts(function(){
  var PostIDS = posts.map(function(post){return post.PostID})
  feed.append(PostIDS)
})

//later
var renderAsJSON = function(){
  return JSON.stringify(feed.asArray()) // JSON representation of the feed index
}
```
**Dealing with cursors**
```js
//translate indexor cursors to your own time based cursor for use in API calls
var posts = {
  1: {time: 1234},
  2: {time: 2345},
  3: {time: 3456}
} //object with all of your posts keyed by id

var feed = new Index([], {
  cursorTranslator: function(ID){return message[ID].time}
})

feed.append(PostIDS) //add some PostIDS
var cursor = feed.getBackmostCursor()
API.getMorePosts({cursor: cursor})
```

## API
### constructor
**new Indexor(chunk, opts)**  
* `chunk`: _Array_ or immutable _List_ : A contiguous section of the index (i.e. it is a complete sequenced set of values) 
* `opts`: _Object_ :  
  * `cursorTranslator`: _fn_ : A function which translates a index element into a application specific cursor.  

### append/prepend/unshift/push
These methods all accept a single array (or immutable List) chunk as an argument and put the chunk either at the beginning or end of the index.  
 
**append**: append the chunk to the end of the index and merge the chunk into the existing cursor range.
**prepend**: prepend the chunk to the front of the index and merge the chunk into the existing cursor range.
**push**: append the chunk to the end of the index and add a new cursor range but do not merge the cursor ranges.
**unshift**: prepend the chunk to the front of the index and add a new cursor range but do not merge the cursor ranges.
* `chunk`: _Array_ or immutable _List_ : The chunk to be added onto the index.


### merge
* `type`: _String_ : the fallback operation to perform if the chunk does not overlap with the existing index
* `chunk`: _Array_ or immutable _List_ : The chunk to be merged into the index.  

If the chunk start and end elements are both already in the index, the index segment between start and end will be replaced in whole with the chunk.  If only the start or end element exists the chunk will be spliced in.

### cursors
A naive implementation can simply use the `getBackmostCursor` in combination with `append` and everthing will magically work.  However if your application requires more nuanced control then you will need to understand how indexor handles cursors.  

Indexor stores cursors as a immutable list of arrays. e.g. [[0, 10] [12, 20]] would indicate that we have populated the index fully between 0 and 10, and between 12 and 20, but we do not know what index elements may exist between 10 and 12, or beyond 20.In the context of an API you will typically want to use 10 (`getFirstBackCursor`) as the basis for your next request. 

However while this multi-cursor apparatus exists, and allows for use cases like twitter mobile app (where the cursor gap is represented by the "load more tweets" button in your feed) it can be safely ignored if you only ever call `append` and `prepend` as these methods always merge the cursors ranges.  Furthermore because append/prepend are explicit about how they want to be inserted, they are optimized to skip much of the processing that occurs in the `merge` method.

All cursor methods will be translated to application specific cursors by the `opts.cursorTranslator` function if provided.
* **getBackmostCursor**: returns the backmost cursor. 
* **getFrontmostCursor**: returns the frontmost curosr.
* **getFirstBackCursor**: returns the first back cursor.
* **getLastFrontCursor**: returns the last front curosr.
* **getCursors**: returns all cursor ranges as an immutable List of arrays

### freezing
Indexes typically have a notion of being terminal endpoints.  E.G. if we have a infinite scrolling message board, the first message ever sent will be terminal. As a matter of conveinence, indexor provides the ability to "freeze" the front or back of the index, which does two things:
* Indicates that the index is terminal at that end (and no future updates should be invoked)
* Throws and error if the consumer attempts to merge onto the frozen end  

This is especially useful when dealing with infinite loading in either or both directions. Six methods are provided to achieve this
* **freezeBack**: set the back (end) as frozen
* **freezeFront**: set the front (beginning) as frozen
* **unfreezeBack**: unfreeze the back
* **unfreezeFront**: unfreeze the front
* **isBackFrozen**: returns true if frozen false if not
* **isFrontFrozen**: returns true if frozen false if not
