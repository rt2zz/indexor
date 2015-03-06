var test = require('tape');
var Index = require('../index.js')


test('merge:append/push', function (t) {
  t.plan(28);

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'e', 'f']
  feed.merge('append', data)
  t.deepEqual(feed.asArray(), ['a', 'b', 'c', 'd', 'e', 'f'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'f']])
  t.equal(feed.getFirstBackCursor(), 'f')
  t.equal(feed.getBackmostCursor(), 'f')
  t.equal(feed.getLastFrontCursor(), 'a')
  t.equal(feed.getFrontmostCursor(), 'a')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'e', 'f']
  feed.merge('push', data)
  t.deepEqual(feed.asArray(), ['a', 'b', 'c', 'd', 'e', 'f'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'c'], ['d', 'f']])
  t.equal(feed.getFirstBackCursor(), 'c')
  t.equal(feed.getBackmostCursor(), 'f')
  t.equal(feed.getLastFrontCursor(), 'd')
  t.equal(feed.getFrontmostCursor(), 'a')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['c', 'b', 'f']
  feed.merge('append', data)
  t.deepEqual(feed.asArray(), ['a', 'c', 'b', 'f'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'f']])
  t.equal(feed.getFirstBackCursor(), 'f')
  t.equal(feed.getBackmostCursor(), 'f')
  t.equal(feed.getLastFrontCursor(), 'a')
  t.equal(feed.getFrontmostCursor(), 'a')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'b', 'c', 'f']
  feed.merge('push', data)
  t.deepEqual(feed.asArray(), ['a', 'd', 'b', 'c', 'f'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'a'], ['d', 'f']])
  t.equal(feed.getFirstBackCursor(), 'a')
  t.equal(feed.getBackmostCursor(), 'f')
  t.equal(feed.getLastFrontCursor(), 'd')
  t.equal(feed.getFrontmostCursor(), 'a')

  var feed = new Index(['a', 'b', 'c'])
  var data = 'd'
  feed.merge('push', data)
  t.deepEqual(feed.asArray(), ['a', 'b', 'c', 'd'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'c'], ['d', 'd']])

  var feed = new Index(['a', 'b', 'c'])
  var data = 'd'
  feed.merge('append', data)
  t.deepEqual(feed.asArray(), ['a', 'b', 'c', 'd'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'd']])
});

test('merge:prepend/unshift', function (t) {
  t.plan(28);

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'e', 'f']
  feed.merge('prepend', data)
  t.deepEqual(feed.asArray(), [ 'd', 'e', 'f', 'a', 'b', 'c'])
  t.deepEqual(feed.getCursors().toArray(), [['d', 'c']])
  t.equal(feed.getFirstBackCursor(), 'c')
  t.equal(feed.getBackmostCursor(), 'c')
  t.equal(feed.getLastFrontCursor(), 'd')
  t.equal(feed.getFrontmostCursor(), 'd')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'e', 'f']
  feed.merge('unshift', data)
  t.deepEqual(feed.asArray(), [ 'd', 'e', 'f', 'a', 'b', 'c'])
  t.deepEqual(feed.getCursors().toArray(), [['d', 'f'], ['a', 'c']])
  t.equal(feed.getFirstBackCursor(), 'f')
  t.equal(feed.getBackmostCursor(), 'c')
  t.equal(feed.getLastFrontCursor(), 'a')
  t.equal(feed.getFrontmostCursor(), 'd')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['c', 'b', 'f']
  feed.merge('prepend', data)
  t.deepEqual(feed.asArray(), ['a', 'c', 'b', 'f'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'f']])
  t.equal(feed.getFirstBackCursor(), 'f')
  t.equal(feed.getBackmostCursor(), 'f')
  t.equal(feed.getLastFrontCursor(), 'a')
  t.equal(feed.getFrontmostCursor(), 'a')

  var feed = new Index(['a', 'b', 'c'])
  var data = ['d', 'b', 'c', 'f']
  feed.merge('unshift', data)
  t.deepEqual(feed.asArray(), ['d', 'b', 'c', 'f', 'a'])
  t.deepEqual(feed.getCursors().toArray(), [['d', 'f'], ['a', 'a']])
  t.equal(feed.getFirstBackCursor(), 'f')
  t.equal(feed.getBackmostCursor(), 'a')
  t.equal(feed.getLastFrontCursor(), 'a')
  t.equal(feed.getFrontmostCursor(), 'd')

  var feed = new Index(['a', 'b', 'c'])
  var data = 'd'
  feed.merge('unshift', data)
  t.deepEqual(feed.asArray(), ['d', 'a', 'b', 'c'])
  t.deepEqual(feed.getCursors().toArray(), [['d', 'd'], ['a', 'c']])

  var feed = new Index(['a', 'b', 'c'])
  var data = 'd'
  feed.merge('prepend', data)
  t.deepEqual(feed.asArray(), ['d', 'a', 'b', 'c'])
  t.deepEqual(feed.getCursors().toArray(), [['d', 'c']])
});

test('append/prepend', function (t) {
  t.plan(8)

  var feed = new Index()
  t.equal(feed.getFirstBackCursor(), null)
  t.equal(feed.getBackmostCursor(), null)

  feed.append(['a', 'b'])
  feed.prepend([0, 1])
  feed.merge('push', ['m'])
  t.deepEqual(feed.asArray(), [ 0, 1, 'a', 'b', 'm' ])
  t.deepEqual(feed.getCursors().toArray(), [[0, 'b'], ['m', 'm']])

  feed.prepend(['a', 'm'])
  t.deepEqual(feed.asArray(), [ 'a', 'm', 0, 1, 'b' ])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'b']])

  feed.append(['a', 'm', 0, 1, 'b'])
  t.deepEqual(feed.asArray(), ['a', 'm', 0, 1, 'b'])
  t.deepEqual(feed.getCursors().toArray(), [['a', 'b']])
})

test('complex', function (t) {
  t.plan(8)

  var feed = new Index()
  t.equal(feed.getFirstBackCursor(), null)
  t.equal(feed.getBackmostCursor(), null)

  feed.merge('append', ['a', 'b'])
  feed.merge('prepend', [0, 1])
  feed.merge('push', ['m'])
  t.deepEqual(feed.asArray(), [ 0, 1, 'a', 'b', 'm' ])
  t.deepEqual(feed.getCursors().toArray(), [[0, 'b'], ['m', 'm']])

  feed.merge('push', ['a', 'm'])
  t.deepEqual(feed.asArray(), [ 0, 1, 'a', 'm' ])
  t.deepEqual(feed.getCursors().toArray(), [[0, 'm']])

  feed.merge('unshift', [0, 'a'])
  t.deepEqual(feed.asArray(), [ 0, 'a', 'm' ])
  t.deepEqual(feed.getCursors().toArray(), [[0, 'm']])
})
