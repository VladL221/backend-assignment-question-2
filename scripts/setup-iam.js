require("dotenv").config();
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const iam = new AWS.IAM();

async function setupIAM() {
  try {
    // Create role for Lambda
    let lambdaRoleArn;
    try {
      const lambdaRoleResponse = await iam
        .createRole({
          RoleName: "LambdaSwaggerRole",
          AssumeRolePolicyDocument: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Service: "lambda.amazonaws.com" },
                Action: "sts:AssumeRole",
              },
            ],
          }),
        })
        .promise();
      lambdaRoleArn = lambdaRoleResponse.Role.Arn;
      console.log("Lambda role created:", lambdaRoleArn);
    } catch (error) {
      if (error.code === "EntityAlreadyExists") {
        const roleResponse = await iam
          .getRole({ RoleName: "LambdaSwaggerRole" })
          .promise();
        lambdaRoleArn = roleResponse.Role.Arn;
        console.log("Lambda role already exists:", lambdaRoleArn);
      } else {
        throw error;
      }
    }

    // Attach necessary policies to Lambda role
    await iam
      .attachRolePolicy({
        RoleName: "LambdaSwaggerRole",
        PolicyArn:
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      })
      .promise();
    console.log("Policies attached to Lambda role");

    // Check if API Gateway policy exists
    const policyName = "ApiGatewayLambdaInvokePolicy";
    try {
      await iam
        .getPolicy({
          PolicyArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:policy/${policyName}`,
        })
        .promise();
      console.log("API Gateway policy already exists");
    } catch (error) {
      if (error.code === "NoSuchEntity") {
        // Create policy for API Gateway to invoke Lambda
        const apiGatewayPolicyResponse = await iam
          .createPolicy({
            PolicyName: policyName,
            PolicyDocument: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: "lambda:InvokeFunction",
                  Resource: `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:swaggerLambdaTest`,
                },
              ],
            }),
          })
          .promise();
        console.log(
          "API Gateway policy created:",
          apiGatewayPolicyResponse.Policy.Arn
        );
      } else {
        throw error;
      }
    }

    console.log("IAM setup completed successfully");

    // Add a delay to allow role to propagate
    console.log("Waiting for role to propagate...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds delay
  } catch (error) {
    console.error("Error setting up IAM:", error);
  }
}

setupIAM();
