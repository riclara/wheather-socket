import DarkSky from 'dark-sky'
import express from 'express'
import Redis from './redis'
import moment from 'moment-timezone'
import expressWs from 'express-ws'
import cors from 'cors'
import cities from './cities'
import page from './page'

const app = express()
const port = process.env.PORT || 8000
const darksky = new DarkSky(process.env.DARK_SKY)
const redisPasswd = process.env.REDIS_PASSWD

const redis = new Redis(19954, 'redis-19954.c14.us-east-1-3.ec2.cloud.redislabs.com', redisPasswd)

app.use(cors())
expressWs(app)

async function query ({country, latitude, longitude}) {
  try {
    if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed')
    const cache = null // await redis.get(country)
    if (cache) return cache
    const data = await darksky
      .latitude(latitude)
      .longitude(longitude)
      .get()
    if (data && data.currently) redis.set(country, data)
    return data
  } catch (error) {
    console.log('error: ', error)
    if (error instanceof Error && error.message === 'How unfortunate! The API Request Failed') {
      const timeStamp = Math.floor(Date.now())
      redis.hset('api.errors', timeStamp, error.message)
      return query({country, latitude, longitude})
    }
    return error
  }
}

app.ws('/weather', function (ws, req) {
  ws.on('message', function (msg) {
    weather().then(data => {
      console.log(data)
      ws.send(JSON.stringify(data))
    }).catch(reason => {
      console.log(reason)
      ws.send(reason)
    })
  })
})

app.get('/', (req, res) => {
  console.log('Get index')
  res.send(page)
})

app.get('/api/v1/temp', async (request, response) => {
  weather().then(data => {
    response.json(data)
  }).catch(reason => {
    console.log(reason)
    response.status(500).json({error: reason})
  })
})

async function weather () {
  const reqs = []
  const cities = await redis.get('cities')
  cities.forEach(element => {
    reqs.push(query(element))
  })
  return Promise.all(reqs).then(data => {
    const resp = data.map(item => {
      const mom = moment(item.currently.time * 1000)
      return {
        timezone: item.timezone,
        hora: mom.tz(item.timezone).format('h:mm:ss a'),
        temperatura: item.currently.temperature
      }
    })
    return resp
  })
}

app.listen(port, (err) => {
  if (err) {
    return console.log('Error on load server: ', err)
  }
  redis.set('cities', cities)
  console.log(`Server is running and listening on ${port}`)
})
