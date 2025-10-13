const serverlessExpress = require('@vendia/serverless-express');
const app = require('../backend/app');

let serverlessHandler;

module.exports = (req, res) => {
  if (!serverlessHandler) {
    serverlessHandler = serverlessExpress({ app });
  }
  return serverlessHandler(req, res);
};


