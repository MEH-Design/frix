module.exports = function authorize(req, res, key) {
  let site = '/' + req.body.site;
  res.cookie(site, req.body.password, {maxAge: 60 * 60 * 24, httpOnly: true});
  res.json({
    authorized: key[site].password === req.body.password,
  });
};
