module.exports = (param) => {
  return param.then(data => {
        return {
          email: data.docs[0].data().email,
          token: data.docs[0].data().token,
          appId: "", // ID da aplicação (pagamento recorrente)
          appKey: "", // Key da aplicação (pagemento recorrente)
          env: data.docs[0].data().isProd ? "production" :  "sandbox",
          log: __dirname + "/log/pagseguro.log",
          debug: data.docs[0].data().isProd ? false : true,
          notificationURL: (data.docs[0].data().isProd ?
            "https://ocomparador.com/" : "http://localhost/"
          ) + "api/authorization/notification",
          redirectURL: (data.docs[0].data().isProd ?
            "https://ocomparador.com/" : "http://localhost/"
          ) + "api/authorization/response"
        }
      })
};
