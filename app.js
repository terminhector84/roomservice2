const express = require("express");
//const routes = require("./routes/routes");
const fs = require("fs");
const path = require("path")
const proxy = require("express-http-proxy");
const logger = require("morgan");
const mongoClient = require("mongodb").MongoClient;
const URL = process.env.MONGDB_URI || "mongodb://localhost:27017/"
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8000;

app.set('etag', false)
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(cors());
app.options('/postData', cors()) 
app.use(express.json());
app.use(logger("dev"));


let db;

async function connectDB(){
    if(!db) db = await mongoClient.connect(URL,{w:1, poolSize:5, useNewUrlParser:true})
    return {
        cursor: db.db("learning_mongo"),
        db:db
    };
}

app.get("/getData", async (req, res)=>{
    const { cursor } = await connectDB();
    let result;
    try{
        result = await cursor.collection("menu").find({}).toArray();
        return res.json({success:true, data:result})
    }catch(e){
        return res.json({success:false, error:e})
    }
})

let postStatus;
app.post("/postData", cors(), async (req, res)=>{
    postStatus = res.statusCode;
    const { cursor } = await connectDB();
    let data = [...req.body];
    let _id = new Date().toString();
    try{
        let result = await cursor.collection("purchase").insertOne({_id:_id, data:[...data]})
        return res.json({success:true, data:result})
    }catch(e){
        return res.json({success:false, error:e})
    }    
})

app.get("/getPurchases", cors(),async (req, res)=>{  
    const { cursor } = await connectDB();
    let result;
    try{
        if(postStatus === 200){
            result = await cursor.collection("purchase")
                    .find({}).sort({_id:-1}).limit(1).toArray();
            return await res.json({success:true, data:result});
        }
    }catch(e){
        return res.json({success:false, error:e})
    } 
})

if(process.env.NODE_ENV === "production"){
    app.use(express.static("browser/build"));

    app.get("*", (req, res)=>{
        res.sendFile(path.join(__dirname, "client", "build", "index.html"));
    })
}

app.listen(PORT);

// const data = fs.readFileSync("./public/data/menu.json", "UTF-8");
//  //when seeding the database use mongoimport in the initialization script
// mongoClient.connect(URL, {useNewUrlParser:true}, (err, db)=>{
//     if(err) throw err;
//     let seed = JSON.parse(data);
//     let cursor = db.db("learning_mongo");
//     cursor.collection("menu").insertMany([...seed], {checkKeys:false}, (err, docs)=>{
//         if(err) throw err;
//         console.log(docs.insertedCount, "docs inserted");
//     })
// });


