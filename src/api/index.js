const express = require("express");
const pagseguro = require("../");
const configurations = require("./config");
const bodyParser = require("body-parser");
const admin = require('firebase-admin');
const functions = require('firebase-functions');

/**
 * Initialize Firebase
 */
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://projetobusca-21e1e.firebaseio.com"
});

const db = admin.firestore()

/**
 * Initialize Express
 */
const app = express();

/**
 * Initialize Config Params
 */
const isProd = app.get('env') == 'development' ? false : true
const configCollection = db.collection("config").where("active", "==", true).where("isProd", "==", isProd).get()
const config = configurations(configCollection);

/**
 * Middleware
 */
app.use(bodyParser.json());

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
  const { transactionCode } = req.query;
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
 * Listen
 */
app.listen(80, function () {
  console.log("App listening on port 80!");
});
