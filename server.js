const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const messagesFile = path.join(__dirname, 'messages.json');

function getMessages() {
    try {
        if (fs.existsSync(messagesFile)) {
            const data = fs.readFileSync(messagesFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Mesajlar okunurken hata oluştu:', err);
    }
    return [];
}

function saveMessage(newMessage) {
    const messages = getMessages();
    messages.push(newMessage);
    try {
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), 'utf8');
    } catch (err) {
        console.error('Mesajlar kaydedilirken hata oluştu:', err);
    }
}

io.on('connection', (socket) => {
    console.log('Bir kullanıcı sohbete bağlandı.');
    socket.emit('load history', getMessages());

    // Kullanıcı mesaj gönderdiğinde
    socket.on('chat message', (data) => {
        console.log(`[GMAIL]: ${data.email} | [İSİM]: ${data.username} | [MESAJ]: ${data.text}`);
        saveMessage(data);
        io.emit('chat message', data);
    });

    // Yazıyor... olayını diğer kullanıcılara bildir
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('stop typing', (data) => {
        socket.broadcast.emit('stop typing', data);
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı.');
    });
});

server.listen(3000, () => {
    console.log('Sunucu çalışıyor: http://localhost:3000');
});