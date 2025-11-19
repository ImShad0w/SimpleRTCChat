const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server);

//Users array
let users = [];

io.on('connection', socket => {
  console.log('A user connected:', socket.id);
  //Get the username and store it in a new user object
  socket.on("username", (data) => {
    const newUser = {
      username: data,
      id: socket.id,
    }
    users.push(newUser);
    //Emit to everyone connected that there is a new user connected
    io.emit("updateUsers", users);
  })
  //1. When one socket wants to connect to us, send an event to accept or not the connection
  socket.on("connectionRequest", (user) => {
    //Find the user we want to connect to
    const peerB = users.find((u) => u.id === user.id);
    console.log(peerB)
    //Send a connection request to the peer B
    //And add ourselves
    const peerA = users.find((u) => u.id === socket.id);
    console.log(peerA)
    io.to(peerB.id).emit("conReq", peerA);
  })
  //2. If we accept the connection, send to the initiator that he needs to create the connection
  socket.on("confCon", (initiator) => {
    //Send to the initator the start of the connection
    io.to(initiator.id).emit("startSignal");
  })

  //2.1 Manage the signals they send each other
  socket.on("sendOffer", (data) => {
    const from = data.from;
    const offer = data.offer;
    const to = data.to;
    //Sending to the user i want to connect to the offer
    io.to(to).emit("sendOffer", {
      from: from,
      offer: offer,
    });
  })

  socket.on("sendAnswer", (data) => {
    //Send it to the initiator
    const from = data.from;
    const answer = data.answer;
    const to = data.to;
    io.to(to).emit("sendAnswer", {
      from: from,
      answer: answer,
    });
  })

  //Handle discconect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    //Delete the user from the array
    users = users.filter((p) => p.id != socket.id);
  })
});



server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

