import express, { Express, Request, Response } from "express";
import {Server} from 'socket.io';
import { IAllUsers } from "./types";
import dotenv from "dotenv";
const leaveRoom = require('./utils/leave-room');
import * as http from 'http';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app); // Add this
const CHAT_BOT = 'ChatBot';
let chatRoom; 
let chatRoomUsers:IAllUsers; 
let allUsers:IAllUsers = []; // All users in current chat room

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

// create io server
const io = new Server(server, {
    cors: {
        origin: `http://localhost:${port}`,
        methods: ['GET', 'POST'],
    },
});

// listen on connection
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);
    // Add a user to a room
    socket.on('join_room', (data) => {
        const { username, room } = data; // Data sent from client when join_room event emitted
        socket.join(room); // Join the user to a socket room
        
        // Add this
        let __createdtime__ = Date.now(); // Current timestamp
        // Send message to all users currently in the room, apart from the user that just joined
        socket.to(room).emit('receive_message', {
        message: `${username} has joined the chat room`,
        username: CHAT_BOT,
        __createdtime__,
        });

        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });

        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);
    });

    socket.on('leave_room', (data) => {
        const { username, room } = data;
        socket.leave(room);
        const __createdtime__ = Date.now();
        // Remove user from memory
        allUsers = leaveRoom(socket.id, allUsers);
        socket.to(room).emit('chatroom_users', allUsers);
        socket.to(room).emit('receive_message', {
            username: CHAT_BOT,
            message: `${username} has left the chat`,
            __createdtime__,
        });
        console.log(`${username} has left the chat`);
    });
});
  

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});