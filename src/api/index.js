require("dotenv").config();
const express = require("express");
const pagseguro = require("../");
const configurations = require("./config");
const bodyParser = require("body-parser");
const admin = require('firebase-admin');
const cors = require('cors');
const createIframe = require('node-iframe');

/**
 * Initialize Express
 */
const app = express();

const isProd = app.get('env') == 'development' ? false : true
const serviceAccountName = app.get('env') == 'development' ? "./serviceAccountKeyDev.json" : "./serviceAccountKeyProd.json"
const databaseURL = app.get('env') == 'development' ? "https://projetobusca-dev.firebaseio.com" : "https://projetobusca-21e1e.firebaseio.com"

/**
 * Initialize Firebase
 */
const serviceAccount = require(serviceAccountName);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

const db = admin.firestore()

/**
 * Initialize Config Params
 */
const configCollection = db.collection("config").where("active", "==", true).where("isProd", "==", isProd).get()
const config = configurations(configCollection);

/**
 * Middleware
 */
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ocomparador.com')
  app.use(cors());
  next()
})

app.use(createIframe.default);

/**
 * Hello
 */
app.get("/api/", function (req, res) {
  res.status(200).json({
    app: "API O Comparador",
    version: "1.0.0"
  });
});

/**
 * Session
 */
app.get("/api/session", function (req, res) {
  config.then(result => {
    const client = pagseguro.connect(result);
    client.session
      .get()
      .then(data => res.status(data.statusCode).json(data))
      .catch(e => res.status(e.statusCode).json(e));
  }).catch(e => {
    console.error(e);
    res.status(e.statusCode || 500).json(e);
  })
});

/**
 * Direct Payment
 */
app.post("/api/directPayment/creditCard", function (req, res) {

  config.then(result => {
    const client = pagseguro.connect(result).transaction.creditCard;

    client(req.body)
      .then(data => res.status(data.statusCode).json(data))
      .catch(e => {
        console.error(e);
        res.status(e.statusCode || 500).json(e);
      });

  }).catch(e => {
    console.error(e);
    res.status(e.statusCode || 500).json(e);
  })

});


/**
 * Authorization notification
 */
app.get("/api/transaction", function (req, res) {
  const {
    transactionCode
  } = req.query;
  config.then(result => {
    const client = pagseguro.connect(result).transaction.get;

    client(transactionCode)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
        console.error(error);
        res.status(error.statusCode || 500).json(error);
      });

  }).catch(e => {
    console.error(e);
    res.status(e.statusCode || 500).json(e);
  })

});

/**
 * X-Frame-Bypass
 */
app.get("/iframe", (req, res) => {
  res.createIframe({
    url: req.query.url,
    baseHref: req.query.baseHref, // optional: determine how to control link redirects,
    config: { cors: { script: false } }, // optional: determine element cors or inlining #shape src/iframe.ts#L34
  });
});

/**
 * Listen
 */
app.listen(process.env.PORT || 80, function () {
  console.log("App listening on port 80!");
});