require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");

async function updateSwagger() {
  try {
    const swaggerPath = path.join(__dirname, "..", "swagger.json");
    let swaggerContent = await fs.readFile(swaggerPath, "utf8");

    // Create the correct Lambda ARN for API Gateway integration
    const lambdaArn = `arn:aws:apigateway:${process.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:swaggerLambdaTest/invocations`;

    // Replace the placeholder with the actual Lambda ARN
    swaggerContent = swaggerContent.replace(/\${LAMBDA_ARN}/g, lambdaArn);

    // Write the updated content back to the file
    await fs.writeFile(swaggerPath, swaggerContent, "utf8");

    console.log("swagger.json updated successfully");
    console.log("Updated Swagger content:", swaggerContent);
  } catch (error) {
    console.error("Error updating swagger.json:", error);
  }
}

updateSwagger();
