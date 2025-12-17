const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri =
  "mongodb+srv://spondon_db_user:7W9LFIDfDz9YcEMK@cluster0.iavbr3y.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    const db = client.db("spondon-db");
    const userCollection = db.collection("users");

    // create user
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "User Already Exists" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });
    // get user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    // create
    // app.post("/toys", async (req, res) => {
    //   const newToy = req.body;
    //   const result = await toyCollection.insertOne(newToy);
    //   res.send(result);
    // });

    // get popular data
    // app.get("/popular-toys", async (req, res) => {
    //   const cursor = toyCollection.find().sort({ rating: -1 }).limit(6);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });
    // get slider data
    // app.get("/slider-toys", async (req, res) => {
    //   const cursor = toyCollection.find().skip(10).limit(3);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // get products by email or all products
    // app.get("/toys", async (req, res) => {
    //   const sellerEmail = req.query.sellerEmail;

    //   let query = {};
    //   if (sellerEmail) {
    //     query = { sellerEmail: sellerEmail };
    //   }

    //   const result = await toyCollection.find(query).toArray();
    //   res.send(result);
    // });

    // read
    // app.get("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await toyCollection.findOne(query);
    //   res.send(result);
    // });

    // update
    // app.patch("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const updatedToy = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: updatedToy,
    //   };
    //   const result = await toyCollection.updateOne(query, updateDoc);
    //   res.send(result);
    // });

    // delete
    // app.delete("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await toyCollection.deleteOne(query);
    //   res.send(result);
    // });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Spondon Database Running");
});
app.listen(port, () => {
  console.log(`port:${port}`);
});
// spondon_db_user
// 7W9LFIDfDz9YcEMK
