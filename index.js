const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


let urlDatabase = {};
let counter = 1;
const loadDatabase = () => {
  try {
    const data = fs.readFileSync('urlDatabase.json', 'utf8');
    urlDatabase = JSON.parse(data);
  } catch (error) {
    console.error('Error loading database:', error.message);
  }
};

loadDatabase();

const saveDatabase = () => {
  try {
    const data = JSON.stringify(urlDatabase, null, 2);
    fs.writeFileSync('urlDatabase.json', data, 'utf8');
  } catch (error) {
    console.error('Error saving database:', error.message);
  }
};

app.post('/api/users', async (req, res) => {
  try {
    if (!req.body || !req.body.username) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { username } = req.body;

    let _id = urlDatabase.users?.find(user => user.username === username)?._id;
    if(!_id) {
      _id = generateUniqueId();
      if(!urlDatabase.users){
        urlDatabase.users = [];
      }
      urlDatabase.users.push({
        username,
        _id
      });
      saveDatabase();
    }

    res.json({
      username,
      _id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    if (!req.body || !req.body.username) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { username } = req.body;

    let _id = urlDatabase.find(user => user.username === username)?._id;
    if(!_id) {
      _id = generateUniqueId();
      urlDatabase.push({
        username,
        _id,
        log: []
      });
      saveDatabase();
    }

    res.json({
      username,
      _id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/users/:_id/exercises', (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    if (duration <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0' });
    }

    if(date){
      const isValidDate = !isNaN(Date.parse(date));
      if (!isValidDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }else{
      date = new Date();
    }

    const user = urlDatabase.users.find((user) => user._id === _id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exercise = {
      description,
      duration,
      date,
    };

    if(!user.log){
      user.log = [];
    }
    user.log.push(exercise);
    saveDatabase();

    res.json({
      _id: user._id, 
      username: user.username,
      date: new Date(date).toDateString(),
      duration: parseInt(duration),
      description,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users/:_id/logs', (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = urlDatabase.users.find((user) => user._id === _id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userLogs = user.log || [];

    if (from) {
      userLogs = userLogs.filter((log) => log.date >= from);
    }

    if (to) {
      userLogs = userLogs.filter((log) => log.date <= to);
    }

    if (limit) {
      userLogs = userLogs.slice(0, Number(limit));
    }

    const response = {
      _id: user._id,
      username: user.username,
      count: userLogs?.length,
      log: userLogs.map((log) => ({
        description: log.description,
        duration: parseInt(log.duration),
        date: new Date(log.date).toDateString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const userList = urlDatabase.users.map((user) => ({
      _id: user._id,
      username: user.username,
    }));

    res.json(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
