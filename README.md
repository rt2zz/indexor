##indexor
Simple / flexible data structure for indexes

### Usage
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

#### Simple Blog Index
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
#### Dealing with cursors
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

### API
#### append/prepend/unshift/push
These methods all accept a single array (or immutable List) chunk as an argument and put the chunk either at the beginning or end of the index.  
`chunk`: _Array_ or immutablejs _List : A contiguous section of the index (i.e. it is a complete sequenced set of values)  

* **append(array)**: append the chunk to the end of the index and merge the chunk into the existing cursor range.
* **prepend(array)**: prepend the chunk to the front of the index and merge the chunk into the existing cursor range.
* **push(array)**: append the chunk to the end of the index and add a new cursor range but do not merge the cursor ranges.
* **unshift(array)**: prepend the chunk to the front of the index and add a new cursor range but do not merge the cursor ranges.

#### merge
* `type`: _String_ : the fallback operation to perform if the chunk does not overlap with the existing index
* `chunk`: _Array_ or immutablejs _List : The chunk to be merged into the index.  

If the chunk start and end elements are both already in the index, the index segment between start and end will be replaced in whole with the chunk.  If only the start or end element exists the chunk will be spliced in.
