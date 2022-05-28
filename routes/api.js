require('dotenv').config();
const mongoose = require("mongoose");
const moment = require('moment');
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true } );

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type : String, required : true },
  exercises: [{
    description: { type: String , required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }]
})

let User = mongoose.model('User', userSchema);

const createAndSaveUser = (data , done ) => {
   let user = new User(data);
   user.save((err,userSaved) => {
     if (err) return console.log(err);
     done(null , userSaved );
   });
};

const createAndSaveExercise = (data , done ) => {
     //console.log(data.date);
     const _id = data._id;
     const exercise = ({
          date: (data.date != '' ? new Date(data.date).toDateString() : new Date() ),
          duration: Number(data.duration),
          description: data.description
     });
    
     User.findById( _id , ( err, userFound ) => {
       if (err) return console.log(err);
       //console.log( userFound );
       if ( !userFound ) return (console.log('User not found'));
       userFound.exercises.push(exercise);
       userFound.save( (xerr , userSaved) => {
          if (xerr) return console.log(xerr);
          done(null, userSaved);
       })
     });
};

const findUsers = (done) => {
    const query = User.find();
    query.select( { exercises : 0 });   
    query.exec( (err, users) => {
      if (err) return console.log(err);
      done(null, users);
    });
};

const userExercisesById = ( xparam, xquery , done) => {
    const _id = xparam._id;
    //console.log(xparam, xquery);
    //const query = User.findById( _id);
    //query.where({ exercises: { date : { $gte: new Date(xquery.from), $lte: new Date( xquery.to) }}});
    //const query = User.findById( _id );
    const ObjectId = mongoose.Types.ObjectId;
    let o_id = new ObjectId(_id);
    //console.log(o_id);
    
    const out = [
      { $match: { "_id" : o_id } },
      { $project: {
        _id: 1,
        username: 1,
        exercises: 1,
      }}  
    ];
    //if ( xquery.from || xquery.limit ){ 
      out.push({ $unwind: '$exercises'});
    //}
    if ( xquery.from && xquery.to ){
      out.push({ $match: { 'exercises.date' : { $gte: new Date(xquery.from), $lte: new Date( xquery.to)}} });
    }
    if ( xquery.limit ){
      out.push({ $limit : 1 });
    }  
    const query = User.aggregate( out );
    //console.log(new Date('1990-01-01'));
    //const query = User.find({"_id": o_id } )
    //     query.where('exercises.duration').eq(5);
    //query.select ({ exercises : { _id: 0 }, __v: 0 });
    query.exec ( ( err, exercises ) => {
       if ( err ) return console.log(err);
       
       //return console.log(exercises);
       done( null , exercises);
    });
};
const userExercisesById2 = ( data , done) => {
    const _id = data._id;
    console.log(_id);
    const conf = [
      { $match: { "_id" : _id } },
    ];
    User.aggregate( conf , ( err, user ) => {
       if ( err ) return console.log(err);
       console.log(user);
       done( null , user);
    });
};

exports.UserModel = User;
exports.createAndSaveUser = createAndSaveUser;
exports.findUsers = findUsers;
exports.createAndSaveExercise = createAndSaveExercise;
exports.userExercisesById = userExercisesById;
exports.userExercisesById2 = userExercisesById2;