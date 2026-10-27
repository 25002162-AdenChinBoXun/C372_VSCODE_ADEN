function showIndex(req, res) {
  res.render('index', { session: req.session });
}

module.exports = { showIndex };
