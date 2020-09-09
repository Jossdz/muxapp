const express = require("express")
const router = express.Router()

/* GET home page */
router.get("/", (req, res, next) => {
  res.render("index")
})

//1. Ruta para mostrar el formulario para crear el concierto
router.get("/concert/new", (req, res) => {
  res.render("new-concert")
})
//2. Ruta para crear el concierto
router.post("/concert/new", (req, res) => {})
//3. Ver el concierto
router.get("/concert/:concertId", (req, res) => {})

module.exports = router
