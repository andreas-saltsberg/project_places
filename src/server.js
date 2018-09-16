import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import mongodb from 'mongodb';

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const MongoClient = mongodb.MongoClient;

let matrix = [];

var uri = "mongodb+srv://admin:kappa123@cluster0-wzfud.mongodb.net/test?retryWrites=true";

MongoClient.connect(uri, function(err, client) {
    const collection = client.db("Places").collection("places");

    collection.find().toArray().then(function (result) {
        matrix = result;
        client.close();
    });

});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/border', (req, res) => {
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("Places").collection("places");

        for (var i = 0; i < 4000; i+= 10) {
            const id = {x: i, y: 3990};
            const border = {_id: id, color: "#000000", author: "Places"};
            collection.replaceOne({_id: id}, border, { upsert: true }).then(function () {
                if (id.x === 3990) client.close();
            });
        }


    });
});

app.get('/clear', (req, res) => {
    MongoClient.connect(uri, function(err, client) {
        const collection = client.db("Places").collection("places");

        collection.remove({color: "#d35400"}).then(function () {
            client.close();
        });
    });
});

server.listen(3000);

io.on('connection', function(client) {
    client.emit("connection_success", matrix);

    client.on('square_clicked', function (data) {
        if (!squareUpdateValid(data)) {
            return;
        }

        data.color = translateColor(data.color);

        if (!data.color) return;

        io.sockets.emit('square_update', data);

        MongoClient.connect(uri, function(err, client) {
            const collection = client.db("Places").collection("places");
            matrix = matrix.filter(item => data._id !== item._id);
            matrix.push(data);

            collection.replaceOne({_id: data._id}, data, { upsert: true }).then(function () {
                client.close();
            });

        });
    });

});

const squareUpdateValid = (data) => {
    return data._id.x < 3990 && data._id.y < 3990 && data._id.y > 0 && data._id.x > 0;
};

const translateColor = (color) => {
  switch (color) {
      case "color-1":
          return "#1abc9c";
      case "color-2":
          return "#2ecc71";
      case "color-3":
          return "#3498db";
      case "color-4":
          return "#9b59b6";
      case "color-5":
          return "#34495e";
      case "color-6":
          return "#f1c40f";
      case "color-7":
          return "#e74c3c";
      case "color-8":
          return "#ffffff";
      default:
          return false;
  }
};