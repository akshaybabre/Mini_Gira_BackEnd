const Company = require("../models/Company");

exports.suggestCompanies = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(200).json({ companies: [] });
    }

    const companies = await Company.find({
      name: { $regex: query.trim().toLowerCase(), $options: "i" },
    })
      .limit(10)
      .select("name");

    res.status(200).json({
      count: companies.length,
      companies,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

