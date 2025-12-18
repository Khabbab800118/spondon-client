const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion } = require("mongodb");

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= MONGODB =================
const uri =
  process.env.MONGODB_URI ||
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
    const activeDonorCollection = db.collection("activeDonors");
    const volunteerCollection = db.collection("volunteers");
    const requestCollection = db.collection("requests");

    // create user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const existing = await userCollection.findOne({ email: user.email });

      if (existing) {
        return res.send({ message: "User already exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get all users
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // get user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    /* =====================================================
       ACTIVE DONOR API
    ===================================================== */

    // activate donor
    app.post("/active-donors", async (req, res) => {
      try {
        const donor = req.body;

        const exists = await activeDonorCollection.findOne({
          email: donor.email,
        });

        if (exists) {
          return res.send({ message: "Donor already active" });
        }

        const result = await activeDonorCollection.insertOne({
          ...donor,
          activatedAt: new Date(),
        });

        res.send({ message: "Donor activated", result });
      } catch (err) {
        res.status(500).send({ error: "Failed to activate donor" });
      }
    });

    // get all active donors
    app.get("/active-donors", async (req, res) => {
      const donors = await activeDonorCollection.find().toArray();
      res.send(donors);
    });

    // Get individual active donor details + check active status
    app.get("/active-donors/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const donor = await activeDonorCollection.findOne({ email });

        if (!donor) {
          // If donor not found, return isActive: false
          return res
            .status(404)
            .send({ message: "Donor not found", isActive: false });
        }

        // Donor exists
        res.send({ ...donor, isActive: true });
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch donor details" });
      }
    });

    // deactivate donor
    app.delete("/active-donors/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await activeDonorCollection.deleteOne({ email });

        if (result.deletedCount === 0) {
          return res.send({ message: "Donor not found" });
        }

        res.send({ message: "Donor deactivated" });
      } catch (err) {
        res.status(500).send({ error: "Failed to deactivate donor" });
      }
    });

    // volunteer api
    // add volunteer
    app.post("/volunteers", async (req, res) => {
      try {
        const volunteer = req.body;

        const exists = await volunteerCollection.findOne({
          email: volunteer.email,
        });

        if (exists) {
          return res.send({ message: "Volunteer already exists" });
        }

        const result = await volunteerCollection.insertOne({
          ...volunteer,
          joinedAt: new Date(),
        });

        res.send({ message: "Volunteer added", result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to add volunteer" });
      }
    });

    // get all volunteers
    app.get("/volunteers", async (req, res) => {
      const volunteers = await volunteerCollection.find().toArray();
      res.send(volunteers);
    });

    // get volunteer by email
    app.get("/volunteers/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const volunteer = await volunteerCollection.findOne({ email });
        res.send(volunteer);
      } catch (err) {
        res.status(500).send({ error: "Failed to get volunteer" });
      }
    });

    // delete volunteer
    app.delete("/volunteers/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await volunteerCollection.deleteOne({ email });

        if (result.deletedCount === 0) {
          return res.send({ message: "Volunteer not found" });
        }

        res.send({ message: "Volunteer deleted" });
      } catch (err) {
        res.status(500).send({ error: "Failed to delete volunteer" });
      }
    });

    const { ObjectId } = require("mongodb"); // Add this at the top

    /* =====================================================
   REQUEST API
===================================================== */

    // Create a new request
    app.post("/requests", async (req, res) => {
      try {
        const request = req.body;

        const result = await requestCollection.insertOne({
          ...request,
          createdAt: new Date(),
        });

        res.send({ message: "Request created", result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to create request" });
      }
    });

    // Get all requests
    app.get("/requests", async (req, res) => {
      try {
        const requests = await requestCollection.find().toArray();
        res.send(requests);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch requests" });
      }
    });

    // Get all requests by requester email
    app.get("/requests/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const userRequests = await requestCollection
          .find({ requesterEmail: email })
          .toArray();
        res.send(userRequests);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch requests for user" });
      }
    });

    // Delete request by id
    app.delete("/requests/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await requestCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.send({ message: "Request not found" });
        }

        res.send({ message: "Request deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to delete request" });
      }
    });

    // ================= CONNECTION CHECK =================
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully");
  } finally {
    // keep connection alive
  }
}

run().catch(console.dir);

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🩸 Spondon Blood Donation Server Running");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
