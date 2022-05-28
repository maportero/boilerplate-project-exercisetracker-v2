const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const moment = require('moment');
const bodyParser = require("body-parser");
const router = express.Router();

const TIMEOUT = 10000;

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

const enableCORS = function (req, res, next) {
  if (!process.env.DISABLE_XORIGIN) {
    const allowedOrigins = ["https://www.freecodecamp.org"];
    const origin = req.headers.origin;
    if (!process.env.XORIGIN_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      //console.log(req.method);
      if ( req.method == 'GET' && req.url.includes('logs'))
         console.log(req.url);
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
      });
    }
  }
  next();
};

const createUser = require("./routes/api.js").createAndSaveUser;

router.post("/api/users", function (req, res, next) {
  // in case of incorrect function use wait timeout then respond
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  const user = req.body; 
  createUser(user, function (err,data) {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if (!data) {
      console.log("Error adding user");
      return next({ message: "Missing add user action" });
    }
    res.json({
      username : data.username, 
      _id : data._id
    });
  });
});
const createExercise = require("./routes/api.js").createAndSaveExercise;
router.post("/api/users/:_id/exercises", function (req, res, next) {
  // in case of incorrect function use wait timeout then respond
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  const data = req.body;
  data._id = req.params._id;
  if ( data.date == undefined ) data.date = '';
  createExercise(data, function (err,user) {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log("Error adding exercise");
      return next({ message: "Missing add exercise action" });
    }
      res.json({
          username: user.username,
          description: user.exercises[user.__v-1].description,
          duration: user.exercises[user.__v-1].duration,
          date: moment(user.exercises[user.__v-1].date).format('ddd MMM DD YYYY'),
          _id: user._id
      });   
  });
});

const findUsers = require("./routes/api.js").findUsers;

router.get('/api/users' , (req, res, next) => {
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  findUsers( (err, users) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if (!users) {
      console.log("Error find users");
      return next({ message: "Missing find users action" });
    }
    res.json(users);
  });
});

const findExercisesByUser = require("./routes/api.js").userExercisesById;
router.get('/api/users/:_id/logs' , (req, res, next) => {
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  const xquery = req.query;
  const xparam = req.params;
  
  findExercisesByUser( xparam, xquery , (err, exercises) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    //console.log(exercises);
    if (!exercises || exercises.length == 0 ) {
      console.log("Error find logs");
      return next({ message: "Missing find logs action" });
    }
    let _id = '';
    let username = '';
    const  logs = exercises.map( item => {
      if ( _id === '') {
        _id = item._id;
        username = item.username;
      }
      
      let dateF= new Date( item.exercises.date )
      //date: moment(item.exercises.date).format('ddd MMM DD') YYYY')
      return ({ 
        description: item.exercises.description, 
        duration: item.exercises.duration,
        date: dateF.toDateString(),
        });
    });
    
    console.log({
      username: username,
      count : logs.length,
      _id : _id,
      log : logs
    });
    
    res.json({
      username: username,
      count : logs.length,
      _id : _id,
      log : logs
    });   
    /*
      const logs = user.exercises.map( item => {
      let dateF= new Date( item. date ).toDateString();
      return ({
        description: item.description,
        duration: item.duration,
        date: moment(item. date).format('ddd MMM DD YYYY')
      });
    });
    
    console.log({
      username: user.username,
      count : exercises.length,
      _id : user._id,
      log : logs
    });
    res.json({
      username: user.username,
      count : exercises.length,
      _id : user._id,
      log : logs
    }); 
    */
  });
});

app.use("/", enableCORS, router);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
