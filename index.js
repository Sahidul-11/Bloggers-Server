const express = require("express")
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;


// MIDDLE WIRE
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://bolgs-website.web.app",
      "https://bolgs-website.firebaseapp.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser())
const verifyToken =(req ,res , next)=>{
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({message : "unauthorize access"})
  }
  if (token) {
    jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded)=>{
      if (err) {
        return res.status(401).send({message : "unauthorize access"})
      }
      req.user = decoded
      next()
    })
  }

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.90yxez6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const BlogsCollection = client.db("BlogsDB").collection("blogs")
    const commentCollection = client.db("BlogsDB").collection("comments")
    const wishListCollection = client.db("BlogsDB").collection("wishList")

    // await client.connect();

    //creating Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d"
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ success: true });
    });

    //clearing Token
    app.get("/logout", async (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
       maxAge: 0 }).send({ success: true });
  });


  app.get("/comment", verifyToken, async (req, res) => {
    const id = req.query.id
    const query = { blogId: id }
    const result = await commentCollection.find(query).toArray()
    res.send(result)
  })


  app.get("/wishList", verifyToken, async (req, res) => {
     const tokenEmail = req.user.email
    const email = req.query.email;
    if (tokenEmail !== email) {
      return res.status(403).send({message : "Forbidden access"})
    }
    const query = { UserEmail: email }
    const result = await wishListCollection.find(query).toArray();
    res.send(result)

  })

  app.put("/details", async (req, res) => {
    const id = req.query.id
    const user = req.body
    const query = { _id: new ObjectId(id) }
    const option = { upsert: true }
    const updateUser = {
      $set: {
        title: user.title,
        Category: user.Category,
        URL: user.URL,
        shortDes: user.shortDes,
        description: user.description,
        Description: user.Description,
      }
    }
    const result = await BlogsCollection.updateOne(query, updateUser, option)
    res.send(result)
  });


  app.get("/details", verifyToken , async (req, res) => {
    const id = req.query.id;
    const query = { _id: new ObjectId(id) }
    const result = await BlogsCollection.findOne(query)
    res.send(result)

  })
  app.delete("/wishList", async (req, res) => {
    const id = req.query.id;
    const query = { _id: new ObjectId(id) }
    const result = await wishListCollection.deleteOne(query)
    res.send(result)

  })
  app.get("/blogs", async (req, res) => {
    let query = {}
    if (req.query?.Category) {
      query = { Category: req.query.Category }

    }
    if (req.query?.search) {

      query = { title: { $regex: req.query.search, $options: 'i' } }

    }

    const result = await BlogsCollection.find(query).toArray();
    res.send(result)
  });

  app.post("/blogs", async (req, res) => {
    const result = await BlogsCollection.insertOne(req.body);
    res.send(result)
  })
  app.post("/comment", async (req, res) => {
    const result = await commentCollection.insertOne(req.body);
    res.send(result)
  })
  app.post("/wishList", async (req, res) => {
    const result = await wishListCollection.insertOne(req.body);
    res.send(result)
  })
  // await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
  // Ensures that the client will close when you finish/error
  // await client.close();
}
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("server is running")
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
