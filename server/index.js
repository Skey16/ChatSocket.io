import http from 'http'
import express from 'express'
import morgan from 'morgan'
import {Server as SocketServer} from 'socket.io'
import fs from 'fs'
import cors from 'cors'
import {PORT} from './config.js'
import path, { dirname } from 'path'


const app = express()
const server = http.createServer(app)
const io = new SocketServer(server, {
    cors: 'http://localhost:5173'
})

app.use(cors())
app.use(morgan('dev'))

let users = []

io.on('connection', socket => {

    socket.on('user', (data, cb) => {
        console.log(data)
        const exists = users.some(user => user.username === data);
        if (exists) {
            cb(false)
        } else {
            cb(true)
            socket.user = {
                username: data,
                socketId: socket.id 
            }; 
            users.push(socket.user)
            console.log(users)
            io.sockets.emit('user', users)
        }
    })

    socket.on('message', message => {
      
    
        let msg = message.trim()
        let arr = msg.split(' ')
    
        if (arr[0] === "@") {
            let user = arr[1];
            let msgW = arr.slice(2).join(" ");;
            console.log(`Usuario: ${user}, Mensaje: ${msgW}`);
    
            const userSocket = users.find(u => u.username === user);
            if (userSocket) {
               
                io.to(userSocket.socketId).emit('message', {
                    body: '[Privado] '+msgW,
                    from: socket.user
                });
                io.to(socket.emit("message",{
                    body: '[Privado] '+msgW,
                    from: socket.user
                }))
            } else {
                alert('El usuario no existe')
            }
          } else {
            io.sockets.emit('message', {
                body: message,
                from: socket.user
            });
        }
    })

    socket.on("upload-file", ({ filename, data }) => {
    
        const fileBuffer = Buffer.from(data.split(",")[1], "base64");
        
        fs.writeFile(`./uploads/${filename}`, fileBuffer, (err) => {
            if (err) throw err;
            console.log('Archivo guardado')
            const filePath = path.join(process.cwd(), 'uploads', filename);
            console.log(filePath)
            fs.readFile(filePath, (err, data) => {
                if (err) {
                  console.error(err);
                } else {
                 
                  io.sockets.emit('image-data', data, socket.user);
                }
            });
            
        })
    });

    socket.on('disconnect', data => {
        if(!socket.user) return
        users.splice(users.indexOf(socket.user),1)
        updateUsers()
    })

    const updateUsers = () => {
        io.sockets.emit('user', users)
    }
})

server.listen(PORT,() => {
    console.log(`Server listen on port ${PORT}`)
})

