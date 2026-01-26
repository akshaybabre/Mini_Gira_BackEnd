const express = require("express");
const router = express.Router();
const { suggestCompanies } = require("../controllers/companyController");

router.get("/suggest", suggestCompanies);

module.exports = router;
