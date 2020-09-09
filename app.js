require("dotenv").config()

const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const express = require("express")
const favicon = require("serve-favicon")
const hbs = require("hbs")
const mongoose = require("mongoose")
const logger = require("morgan")
const path = require("path")
const { readFile, writeFile } = require("fs")
const Mux = require("@mux/mux-node")
const { Video, Data } = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET
)

mongoose
  .connect("mongodb://localhost/muxapp", { useNewUrlParser: true })
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error("Error connecting to mongo", err)
  })

const app_name = require("./package.json").name
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
)

const app = express()

// Middleware Setup
app.use(logger("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
)

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "hbs")
app.use(express.static(path.join(__dirname, "public")))
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")))

// default value for title local
app.locals.title = "Express - Generated with IronGenerator"

const index = require("./routes/index")
app.use("/", index)

let STREAM

// Reads a state file looking for an existing Live Stream, if it can't find one,
// creates a new one, saving the new live stream to our state file and global
// STREAM variable.

// Creates a new Live Stream so we can get a Stream Key
const createLiveStream = async () => {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    console.error(
      "It looks like you haven't set up your Mux token in the .env file yet."
    )
    return
  }

  // Create a new Live Stream!
  return await Video.LiveStreams.create({
    playback_policy: "public",
    reconnect_window: 10,
    new_asset_settings: { playback_policy: "public" }
  })
}
const stateFilePath = `/stream`
const initialize = async () => {
  try {
    const stateFile = await readFile(stateFilePath, "utf8")
    STREAM = JSON.parse(stateFile)
    console.log("Found an existing stream! Fetching updated data.")
    STREAM = await Video.LiveStreams.get(STREAM.id)
  } catch (err) {
    console.log("No stream found, creating a new one.")
    STREAM = await createLiveStream()
    await writeFile(stateFilePath, JSON.stringify(STREAM))
  }
  return STREAM
}

// Starts the HTTP listener for our application.
// Note: glitch helpfully remaps HTTP 80 and 443 to process.env.PORT
initialize().then(stream => {
  const listener = http.listen(4000, function () {
    console.log("Your app is listening on port " + listener.address().port)
    console.log("HERE ARE YOUR STREAM DETAILS, KEEP THEM SECRET!")
    console.log(`Stream Key: ${stream.stream_key}`)
  })
})

module.exports = app
