require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs").promises;
const path = require("path");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

async function checkLambdaExists(functionName) {
  try {
    await lambda.getFunction({ FunctionName: functionName }).promise();
    console.log(`Lambda function ${functionName} exists`);
    return true;
  } catch (error) {
    if (error.code === "ResourceNotFoundException") {
      console.log(`Lambda function ${functionName} does not exist`);
      return false;
    }
    throw error;
  }
}

async function importAPI() {
  try {
    const lambdaExists = await checkLambdaExists("swaggerLambdaTest");
    if (!lambdaExists) {
      console.error(
        "Lambda function does not exist. Please deploy the Lambda function first."
      );
      return;
    }

    const swaggerPath = path.join(__dirname, "..", "swagger.json");
    const swaggerContent = await fs.readFile(swaggerPath, "utf8");

    const params = {
      body: swaggerContent,
      failOnWarnings: true,
    };

    const result = await apigateway.importRestApi(params).promise();
    console.log("API imported successfully:", result);

    await apigateway
      .createDeployment({
        restApiId: result.id,
        stageName: "prod",
      })
      .promise();

    console.log("API deployed to prod stage");
  } catch (error) {
    console.error("Error importing API:", error);
  }
}

importAPI();
