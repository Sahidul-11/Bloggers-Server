const express = require("express")
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const commentCollection = client.db("BlogsDB").collection("comments")
    const wishListCollection = client.db("BlogsDB").collection("wishList")
    
    await client.connect();
   app.get("/comment", async(req , res)=>{
    const id = req.query.id
    const query = {blogId : id}
    const result = await commentCollection.find(query ).toArray()
    res.send(result)
   }) 


   app.get("/wishList", async(req , res)=>{
    const email = req.query.email;
    const query = {UserEmail : email} 
    const result = await wishListCollection.find(query).toArray();
    res.send(result)
  
  })

  app.put("/details", async(req , res)=>{
    const id =req.query.id
    const user = req.body
    const query = {_id : new ObjectId(id)} 
    const option = {upsert : true}
    const updateUser ={
      $set :{
        title : user.title, 
        Category :user.Category,  
        URL :user.URL, 
        shortDes :user.shortDes, 
        description :user.description, 
        Description :user.Description, 
      }
    }
    const result = await BlogsCollection.updateOne(query,updateUser, option)
    res.send(result)
  });

    
    app.get("/details", async(req , res)=>{
      const id = req.query.id;
      const query = {_id : new ObjectId(id)} 
      const result = await BlogsCollection.findOne(query)
      res.send(result)

    })
    app.delete("/wishList", async(req , res)=>{
      const id = req.query.id;
      const query = {_id : new ObjectId(id)} 
      const result = await wishListCollection.deleteOne(query)
      res.send(result)
    
    })
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
   app.post("/comment", async (req , res)=>{
    const result = await commentCollection.insertOne(req.body);
    res.send(result)
   })
   app.post("/wishList", async (req , res)=>{
    const result = await wishListCollection.insertOne(req.body);
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
