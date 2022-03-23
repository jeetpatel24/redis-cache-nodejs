const express = require('express');
const app = express();
const redis = require('redis')
const fetch = require('node-fetch')

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);


app.use(express.json());

//set response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github repos</h2>`;
}

//Make request to Github for data
async function getRepos(req, res, next) {
    try {
        console.log('Fetching Data...');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;
        
        //set data to redis
        //setex(key, expiration_time, value);
        client.setex(username, 3600, repos);

        res.send(setResponse(username, repos));
    } catch (error) {
        console.log(error);
        res.status(500);
    }
}

//cache middleware
function cache(req, res, next) {
    const {username} = req.params;

    client.get(username, (err, data) => {
        if(err) throw err;

        if(data != null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}


app.get('/repos/:username', cache, getRepos);

app.listen(5000, () => {
    console.log(`server is runnig on port ${PORT}`);
})






// const DEFAULT_EXPIRATION = 3600; //in seconds

// app.get('/photos', async (req, res) => {
//     const albumId = req.query.albumId;

//     redisClient.get('photos', async (error, photos) => {
//         if (error) console.log(error);

//         if (photos != null) {
//             return res.json(JSON.parse(photos));
//         }
//         else {
//             const { data } = await axios.get('https://jsonplaceholder.typicode.com/photos',
//                 { params: { albumId } }
//             )

//             //set data in redis setting photos as a key with expiration
//             redisClient.setEx('photos', DEFAULT_EXPIRATION, JSON.stringify(data));
//         }
//         res.json(data);
//     })
// })

// app.get('/photos/:id', async (req, res) => {
//     const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`);
//     res.json(data);
// })