const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
//database 
const mongoose = require('mongoose');
const dbUrl = "mongodb+srv://kum9748ar:kum9711@cluster0.wxlxk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose.connect(dbUrl, { useNewUrlParser: true }).then(() => {
  console.log('connection Success !!');
}, err => { console.log(err) }
)
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const { Schema } = mongoose;


const exerciseSchema = new Schema({
  uid: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date }
}
)

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  log: [exerciseSchema]
})
const User = mongoose.model('users', userSchema);
const Session = mongoose.model('session', exerciseSchema);


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
//create users 
app.post('/api/users', async (req, res) => {
  let { username } = req.body;
  try {
    const findOne = await User.findOne({ username: username });
    if (findOne) {
      res.send(findOne)
    }
    else {
      const findOne = new User({
        username: username,
      })
      findOne.save().then(findOne => {
        res.status(200).json({
          "username": findOne.username, "_id": findOne._id
        })
      })
    }
  }
  catch (err) {
    if (err) {
      console.log(err);
      res.status(500).send('Server error ');
    }
  }

})
//get all Users 
app.get('/api/users', async (req, res) => {
  try {
    let findAll = await User.find();
    res.send(findAll);
  }
  catch (err) {
    if (err) {
      console.log(err);
    }
    res.satus(501).send('internal server error');
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  id = req.params._id;
  let { description } = req.body;
  let { date } = req.body;
  let { duration } = req.body;

  try {
    let ses = await new Session({
      description: description,
      duration: duration,
      date: date
    })
    if (ses.date === '' || ses.date === null) {
      ses.date = new Date().toISOString().substring(0, 10)
    }
    User.findByIdAndUpdate(
      id,
      { $push: { log: ses } },
      (error, docs) => {
        if (!error) {
          let obj = {}
          obj['_id'] = docs._id
          obj['username'] = docs.username
          obj['date'] = new Date(ses.date).toDateString()
          obj['duration'] = ses.duration
          obj['description'] = ses.description

          res.json(obj)
        }
      }
    )
  }
  catch (err) {
    if (err) {
      console.log(err);
    }
    res.status(501).send('not found');
  }
})


app.get('/api/users/:_id/logs', async (req, res) => {
    let { _id } = req.params;
    try {
        await User.findById(_id, (error, result) => {
            if (!error) {
                let resObj = result
                if (req.query.from || req.query.to) {

                    let fromDate = new Date(0)
                    let toDate = new Date()

                    if (req.query.from) {
                        fromDate = new Date(req.query.from)
                    }

                    if (req.query.to) {
                        toDate = new Date(req.query.to)
                    }

                    fromDate = fromDate.getTime()
                    toDate = toDate.getTime()

                    resObj.log = resObj.log.filter((session) => {
                        let sessionDate = new Date(session.date).getTime()

                        return sessionDate >= fromDate && sessionDate <= toDate

                    })

                }

                if (req.query.limit) {
                    resObj.log = resObj.log.slice(0, req.query.limit)
                }

                resObj = resObj.toJSON()
                resObj['count'] = result.log.length
                res.json(resObj)

            }
        })

    }
    catch (err) {
        if (err) {
            console.log(err)
        }
    }


})
//create users 
app.post('/api/users', async (req, res) => {
    let { username } = req.body;
    try {
        const findOne = await User.findOne({ username: username });
        if (findOne) {
            res.send(findOne)
        }
        else {
            const findOne = new User({
                username: username,
            })
            findOne.save().then(findOne => {
                res.status(200).json({
                    "username": findOne.username, "_id": findOne._id
                })
            })
        }
    }
    catch (err) {
        if (err) {
            console.log(err);
            res.status(500).send('Server error ');
        }
    }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
