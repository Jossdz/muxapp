const express = require("express")
const router = express.Router()
const axios = require("axios")
const Concert = require("../models/Concert")

/* GET home page */
router.get("/", async (req, res, next) => {
  const concerts = await Concert.find()
  res.render("index", { concerts })
})

//1. Ruta para mostrar el formulario para crear el concierto
router.get("/concert/new", (req, res) => {
  res.render("new-concert")
})
//2. Ruta para crear el concierto
router.post("/concert/new", async (req, res) => {
  const { band, name, duration } = req.body
  // 2.Generar un nuevo liveStream en Mux
  const {
    data: {
      data: { stream_key, playback_ids, id }
    }
  } = await axios.post(
    "https://api.mux.com/video/v1/live-streams",
    {
      playback_policy: "public",
      new_asset_settings: {
        playback_policy: "public"
      }
    },
    {
      auth: {
        username: process.env.MUX_TOKEN_ID,
        password: process.env.MUX_TOKEN_SECRET
      }
    }
  )
  await Concert.create({
    name,
    duration,
    band,
    streamKey: stream_key,
    playbackId: playback_ids[0].id,
    streamId: id
  })
  res.redirect("/")
})
//3. Ver el concierto
router.get("/concert/:concertId", async (req, res) => {
  const concert = await Concert.findById(req.params.concertId)
  res.render("concertDetail", concert)
})

module.exports = router
