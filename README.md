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

//simple index, e.g. blog posts
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
