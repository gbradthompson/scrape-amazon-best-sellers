const mongo = require('./mongodb')
const md5 = require('md5')

class LinkManager {
  constructor() {
    this.collection = 'crawler_links'
  }

  seedLink (uri, text) {
    return this.addLink(uri, text, false)
  }

  addLink (uri, text, parent_uri) {
    let uri_md5 = md5(uri.toLowerCase())
    let parent_uri_md5 = md5(parent_uri === false ? false : parent_uri.toLowerCase())

    return new Promise((resolve, reject) => {
      mongo.getDB().then(db => {
        db.collection(this.collection).find({uri_md5}).toArray((err, docs) => {
          if (err) reject(err)
          else {
            if (docs.length == 0) {
              db.collection(this.collection).insertOne({text, uri, uri_md5, parent_uri, parent_uri_md5, added: Date.now(), last_scraped: 0, scraped: false, worker: 'none'}, (err, results) => {
                if (err) reject(err)
                else resolve(true)
              })
            } else {
              resolve(false)
            }
          }
        })
      })
    })
  }

  checkoutLink (worker) {
    return new Promise((resolve, reject) => {
      mongo.getDB().then(db => {
        db.collection(this.collection).findOneAndUpdate({scraped: false, worker: 'none'}, {$set: {worker}}, (err, results) => {
          if (err) reject(err)
          else {
            if (results.value) {
              resolve(results.value)
            } else {
              reject('0 links found to scrape!')
            }
          }
        })
      })
    })
  }

  releaseLink (_id) {
    return new Promise((resolve, reject) => {
      mongo.getDB().then(db => {
        db.collection(this.collection).updateOne({_id}, {$set: {worker: 'none', scraped: true, last_scraped: Date.now()}}, (err, results) => {
          if (err) reject(err)
          else resolve(true)
        })
      })
    })
  }
}

module.exports = new LinkManager()
