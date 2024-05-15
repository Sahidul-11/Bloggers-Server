const express = require("express")
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;


// MIDDLE WIRE
app.use(cors());
app.use(express.json());


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
    await client.connect();
    
    app.get("/blogs", async(req, res)=>{
      let query = {}
      if (req.query?.Category) {
        query = {Category :req.query.Category }
        
      }
      if (req.query?.search) {
       
        query = {title: {$regex:req.query.search , $options: 'i'}}
        
      }

      const result = await BlogsCollection.find(query).toArray();
      res.send(result)
    });

   app.post("/blogs", async (req , res)=>{
    const result = await BlogsCollection.insertOne(req.body);
    res.send(result)
   })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req ,res)=>{
  res.send("server is running")
})
 app.listen(port ,()=>{
    console.log(`Server is running on port ${port}`)
 })
