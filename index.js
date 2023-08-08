const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

const pass = process.env.DOC_PASS;
const user = process.env.DOC_USER;

const uri = `mongodb+srv://${user}:${pass}@cluster0.rbjgw7e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("NotesDB").collection("Users");
    const notesCollection = client.db("NotesDB").collection("Notes");

    //get single user by email or all users
    app.get("/users", async (req, res) => {
      let query = {};
      const email = req.query?.email;

      if (email) {
        query = { email };
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      } else {
        const result = await usersCollection.find().toArray();
        res.send(result);
      }
    });

    //update user to author
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      //console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "author",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //save user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "This user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // find note accoring to search result
    app.get("/searchNotes", async (req, res) => {
      let query = {};
      const email = req.query?.email;
      const mysearch = req.query?.search;

      if (email && mysearch) {
        query = {
          email,
          title: { $regex: ".*" + mysearch + ".*", $options: "i" },
        };
      }

      const result = await notesCollection.find(query).toArray();

      res.send(result);
    });
    // find note accoring to category
    app.get("/notesByCategory", async (req, res) => {
      let query = {};
      const email = req.query?.email;
      const cat = req.query?.cat;

      if (email && cat) {
        query = { email, subCategory: cat };
      }

      const result = await notesCollection.find(query).toArray();
      res.send(result);
    });

    //create a single Note
    app.post("/notes", async (req, res) => {
      const singleNote = req.body;
      const result = await notesCollection.insertOne(singleNote);
      res.send(result);
    });

    // read notes accoring to only email
    app.get("/notes", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await notesCollection.find(query).toArray();
      res.send(result);
    });

    //delete a single note
    app.delete("/note/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await notesCollection.deleteOne(query);
      res.send(result);
    });

    //find one note by id
    app.get("/notes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await notesCollection.findOne(query);
      res.send(result);
    });

    //update single note
    app.put("/notes/:id", async (req, res) => {
      const id = req.params.id;
      const aNote = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const title = aNote.title;
      const notes = aNote.notes;
      const subCategory = aNote.subCategory;
      const photo = aNote.photo;

      const updateNote = {
        $set: {
          title: title,
          notes: notes,
          subCategory: subCategory,
          photo: photo,
        },
      };
      const result = await notesCollection.updateOne(
        filter,
        updateNote,
        options
      );
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Note is running `);
});

app.listen(port, () => {
  console.log(`Note is running on port: ${port}`);
});
