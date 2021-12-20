const express = require('express')
const http = require('http')
const cors = require('cors')
const { MongoClient } = require('mongodb');
const socketio = require('socket.io')

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app)
const io = socketio(server, {
    cors: { origin: '*' }
})

// Middlewire
app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://devcord:CklwgDnC1tJ2i5CB@cluster0.q3v5j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        console.log("Db connected")

        const devcordDB = client.db("devcord");
        const conversationsDB = client.db('conversations')
        const roomsCollection = devcordDB.collection('rooms')


        // socket connect
        io.on('connection', socket => {
            console.log('a user is connected')

            // join
            socket.on("join", ({ user, room }) => {
                socket.join(room._id)

            })

            // new message
            socket.on("new-message", async data => {
                const roomid = `c_${data.roomId}`
                io.to(data.roomId).emit('get-new-message', data)
                // io.to(data.roomId).emit('new-message', data)
                // push it to server
                const messageCollection = conversationsDB.collection(roomid)
                const result = await messageCollection.insertOne(data)
            })

            // disconnect user
            socket.on('disconnect', () => {
                console.log('A user is left')
            })
        })



        // all routes----
        // get- All rooms
        app.get('/rooms', async (req, res) => {
            const rooms = await roomsCollection.find({}).toArray()

            res.json(rooms)
        })

        // post - add new room
        app.post('/rooms', async (req, res) => {
            const body = req.body
            const result = await roomsCollection.insertOne(body)

            res.json(result)
        })

        // get - specific room conversation
        app.get('/conversation', async (req, res) => {
            const { roomid } = req.query
            const messageCollection = conversationsDB.collection(roomid)
            const messages = await messageCollection.find({}).toArray()

            res.json(messages)
        })


    } finally {
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('server is running')
})

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))