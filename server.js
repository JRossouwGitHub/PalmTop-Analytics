const express = require('express')
const PORT = process.env.PORT | 80
const app = express()
const bodyParser = require('body-parser')
const Analytics = require('./routes/Analytics.js')

app.use(bodyParser.json())
app.use('/', Analytics)

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`)
})