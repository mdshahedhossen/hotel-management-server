const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const { MongoClient, ServerApiVersion,ObjectId} = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ogdr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  // console.log(authHeader)
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  // console.log(token)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run(){
  try{
    await client.connect();
    const roomsCollection = client.db("hotel_management").collection("rooms")
    const resrveCollection = client.db("hotel_management").collection("reserve")
    const userCollection = client.db("hotel_management").collection("users")

    app.get('/rooms',async(req,res)=>{
      const query={}
      const cursor=roomsCollection.find(query)
      const room = await cursor.toArray();
      res.send(room);
  });

  app.get('/user', async (req, res) => {
    const users = await userCollection.find().toArray();
    res.send(users);
  });

  app.get('/admin/:email', async(req, res) =>{
    const email = req.params.email;
    const user = await userCollection.findOne({email: email});
    const isAdmin = user.role === 'admin';
    res.send({admin: isAdmin})
  });

  /*-------------------Make Admin----------------- */
  app.put('/user/admin/:email', async (req, res) => {
    const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

  })

  app.get('/rooms/:id',async(req,res)=>{
    const id=req.params.id
    const query={_id:ObjectId(id)};
    const room=await roomsCollection.findOne(query);
    res.send(room)
});

app.post('/reserve',async(req,res)=>{
    const reserve=req.body;
    const result=await resrveCollection.insertOne(reserve)
    res.send({ success: true, result })
});

/*-------------------------------All user--------------------------- */

app.put('/user/:email', async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const filter = { email: email };
  const options = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await userCollection.updateOne(filter, updateDoc, options);
  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
  res.send({ result, token });
})


  }
  finally{

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})