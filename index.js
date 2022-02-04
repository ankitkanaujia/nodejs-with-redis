import express from 'express';
import redis from 'redis';
import fetch from "node-fetch";

const PORT=process.env.PORT || 4400;
const REDIS_PORT=process.env.PORT || 6379;

const client= redis.createClient(REDIS_PORT);

await client.connect();

const app = express();
//

 function setResponse(username,repos){
  return `<h2>${username} has ${repos} github repos</h2>`
}

//Make request to gihub for data

 async function getRepos(req,res,next){
    try{
     console.log('Fetching data..');
     const {username}=req.params;
     const response = await fetch(`https://api.github.com/users/${username}`);
     const data=await response.json();
     const repos=data.public_repos;
     client.setEx(username,3600, JSON.stringify(data));
     //Set data to Redis

//    client.setEx(username, 3600, repos);
 
     res.send(setResponse(username,data));
    }catch(err){
      console.log(err);
      res.sendStatus(500);
    }
}
//cache middleware

async function cache(req, res, next) {
    const { username } = req.params;
    console.log("Entered");
    let data = await client.get(username);
    let result =JSON.parse(data);
    console.log(result);
    if(result !==null){
    console.log("Sending data")
    res.send(setResponse(username,result.public_repos));
    }else{
    next();
    }
  }

app.get('/repos/:username',cache,getRepos);

app.listen(4400, () => {
  console.log(`App listening on port 4400`);
});