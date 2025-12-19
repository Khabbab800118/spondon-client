// api/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

// ================= MONGODB =================
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MongoDB URI is not defined in environment variables");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collections
let userCollection,
  activeDonorCollection,
  volunteerCollection,
  requestCollection,
  approvedRequestsCollection;

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("🩸 Spondon Blood Donation Server Running");
});

// -------- USERS --------
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const existing = await userCollection.findOne({ email: user.email });
    if (existing) return res.send({ message: "User already exists" });
    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to create user" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await userCollection.find().toArray();
    res.send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch users" });
  }
});

app.get("/users/:email", async (req, res) => {
  try {
    const user = await userCollection.findOne({ email: req.params.email });
    res.send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch user" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const result = await userCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete user" });
  }
});

app.patch("/users/:id", async (req, res) => {
  try {
    const { isDisabled } = req.body;
    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isDisabled } }
    );
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update user" });
  }
});

// -------- ACTIVE DONORS --------
app.post("/active-donors", async (req, res) => {
  try {
    const donor = req.body;
    const exists = await activeDonorCollection.findOne({ email: donor.email });
    if (exists) return res.send({ message: "Donor already active" });
    const result = await activeDonorCollection.insertOne({
      ...donor,
      activatedAt: new Date(),
    });
    res.send({ message: "Donor activated", result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to activate donor" });
  }
});

app.get("/active-donors", async (req, res) => {
  try {
    const donors = await activeDonorCollection.find().toArray();
    res.send(donors);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch donors" });
  }
});

app.get("/active-donors/:email", async (req, res) => {
  try {
    const donor = await activeDonorCollection.findOne({
      email: req.params.email,
    });
    if (!donor)
      return res
        .status(404)
        .send({ message: "Donor not found", isActive: false });
    res.send({ ...donor, isActive: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch donor details" });
  }
});

app.delete("/active-donors/:email", async (req, res) => {
  try {
    const result = await activeDonorCollection.deleteOne({
      email: req.params.email,
    });
    if (result.deletedCount === 0)
      return res.send({ message: "Donor not found" });
    res.send({ message: "Donor deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to deactivate donor" });
  }
});

// -------- VOLUNTEERS --------
app.post("/volunteers", async (req, res) => {
  try {
    const volunteer = req.body;
    const exists = await volunteerCollection.findOne({
      email: volunteer.email,
    });
    if (exists) return res.send({ message: "Volunteer already exists" });
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

app.get("/volunteers", async (req, res) => {
  try {
    const volunteers = await volunteerCollection.find().toArray();
    res.send(volunteers);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch volunteers" });
  }
});

app.get("/volunteers/:email", async (req, res) => {
  try {
    const volunteer = await volunteerCollection.findOne({
      email: req.params.email,
    });
    res.send(volunteer);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch volunteer" });
  }
});

app.delete("/volunteers/:email", async (req, res) => {
  try {
    const result = await volunteerCollection.deleteOne({
      email: req.params.email,
    });
    if (result.deletedCount === 0)
      return res.send({ message: "Volunteer not found" });
    res.send({ message: "Volunteer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete volunteer" });
  }
});

// -------- REQUESTS --------
app.post("/requests", async (req, res) => {
  try {
    const request = { ...req.body, createdAt: new Date() };
    const result = await requestCollection.insertOne(request);
    res.send({ message: "Request created", result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to create request" });
  }
});

app.get("/requests", async (req, res) => {
  try {
    const { bloodGroup, email } = req.query;
    const query = {};
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (email) query.requesterEmail = email;
    const requests = await requestCollection.find(query).toArray();
    res.send(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch requests" });
  }
});

app.delete("/requests/:id", async (req, res) => {
  try {
    const result = await requestCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0)
      return res.send({ message: "Request not found" });
    res.send({ message: "Request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete request" });
  }
});

app.patch("/requests/approve/:id", async (req, res) => {
  try {
    const request = await requestCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!request) return res.status(404).send({ message: "Request not found" });

    const approvedRequest = {
      ...request,
      approvedAt: new Date(),
      status: "approved",
    };
    await approvedRequestsCollection.insertOne(approvedRequest);
    await requestCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    res.send({ message: "Request approved successfully", approvedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to approve request" });
  }
});

// -------- APPROVED REQUESTS --------
app.get("/approved-requests", async (req, res) => {
  try {
    const requests = await approvedRequestsCollection.find().toArray();
    res.send(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch approved requests" });
  }
});

app.get("/approved-requests/donor/:email", async (req, res) => {
  try {
    const requests = await approvedRequestsCollection
      .find({ donorEmail: req.params.email })
      .toArray();
    res.send(requests);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Failed to fetch donor's approved requests" });
  }
});

app.get("/approved-requests/volunteer/:email", async (req, res) => {
  try {
    const requests = await approvedRequestsCollection
      .find({ requesterEmail: req.params.email })
      .toArray();
    res.send(requests);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Failed to fetch volunteer's approved requests" });
  }
});

app.delete("/approved-requests/:id", async (req, res) => {
  try {
    const result = await approvedRequestsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0)
      return res.status(404).send({ message: "Approved request not found" });
    res.send({ message: "Approved request deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to delete approved request" });
  }
});

// ================= START SERVER =================
async function startServer() {
  try {
    await client.connect();
    console.log("✅ MongoDB connected");

    const db = client.db("spondon-db");
    userCollection = db.collection("users");
    activeDonorCollection = db.collection("activeDonors");
    volunteerCollection = db.collection("volunteers");
    requestCollection = db.collection("requests");
    approvedRequestsCollection = db.collection("approvedRequests");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
  }
}

startServer();
