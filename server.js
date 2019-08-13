const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const todoRoutes = express.Router();
const PORT = 4000;
const bcrypt = require('bcrypt');
const userRoutes = require('./routes/Users-routes');
const dotenv = require('dotenv')
dotenv.config();
let Todo = require('./app/api/models/todo.model');
app.use(cors());

app.use(bodyParser.json());

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-sfqce.gcp.mongodb.net/test?retryWrites=true&w=majority`, { useNewUrlParser: true });
const connection = mongoose.connection; connection.once('open', function () {
    console.log("MongoDB database connection established successfully");
})

todoRoutes.get('/', (req, res) => {
    Todo.find(function (err, todos) {
        if (err) {
            console.log(err);
        } else {
            res.json(todos);
        }
    });
});

const returnLast = async () => {
  const data = await Todo.find().sort('_id','descending').limit(1);
  console.log(data);
  return data.then((err, res) => {
    if(err){
      console.log(err);
    } else {
      res.json(todos);
    }
  })/*.find((err, doc) => {
    const lastData = JSON.stringify(doc);
    console.log(lastData);
    return lastData)*/
  }


function verifyToken(req, res, next) {
    //get Headers Value
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined'){
        //Split bearer header,   
        // we received the token like this: Authorization: Bearer <Token>
        const bearer = bearerHeader.split(' ')
        // get token
        const token = bearer[1];
        // set the token
        req.token = token;
        next();
    }else{
        // error "Forbidden message";
        res.status(403).json({
            success: false,
            message: 'Forbidden'
        });
        next();
    }
}
todoRoutes.post('/delete', verifyToken, (req, res) => {
    jwt.verify(req.token, 'palabras', (err, authData) => {
        if (err) {
            //error with JWT
            res.status(403).json({
                success: false,
                message: err
            })
        } else {
            //erase data from data base
            let id = req.body._id
            Todo.deleteOne({ _id: id }, (err, response) => {
                if (err || response.deletedCount == 0) {
                    // return error from database
                    res.json({
                        success: false,
                        message: err,
                        count: response.deletedCount
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: 'Deleted successfully!',
                        res: response
                    })
                }
            })
        }
    })
})

app.post('/add', verifyToken, (req, res) => {
    console.log(req.token);
    jwt.verify(req.token, 'palabra', (err, authData) => {
        if(err) {
            // error from JWT
            res.status(403).json({
                success: false,
                message: err
            })
        }else {
            // add data to Data Base
            let todo = new Todo(req.body);
            todo.save()
                .then(todo => {
                    res.status(200).json({
                        success: true,
                        message: 'Post created!',
                        authData
                    }) 
                })
                .catch(err => {
                    // error from Data Base
                    res.status(400).send('adding new todo failed');
                });
        }
    })
});

todoRoutes.post('/update/:id', function (req, res) {
    Todo.findById(req.params.id, function (err, todo) {
        if (!todo)
            res.status(404).send("data is not found");
        else
            todo.todo_description = req.body.todo_description;
        todo.save().then(todo => {
            res.json('Todo updated!');
        })
            .catch(err => {
                res.status(400).send("Update not possible");
            });
    });
});





app.use('/todos', todoRoutes);
// localhost:4000/users/
app.use('/users', userRoutes);

app.listen(PORT, function () {
    console.log("Server is running on Port: " + PORT);
})
