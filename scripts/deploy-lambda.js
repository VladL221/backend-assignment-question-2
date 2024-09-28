require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs");
const archiver = require("archiver");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const lambda = new AWS.Lambda();
const s3 = new AWS.S3();
const iam = new AWS.IAM();

async function createBucketIfNotExists(bucketName) {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`Bucket ${bucketName} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      await s3.createBucket({ Bucket: bucketName }).promise();
      console.log(`Bucket ${bucketName} created successfully`);
    } else {
      throw error;
    }
  }
}

async function getRoleArn() {
  const roleName = "LambdaSwaggerRole";
  try {
    const data = await iam.getRole({ RoleName: roleName }).promise();
    return data.Role.Arn;
  } catch (error) {
    console.error(`Error getting role ARN: ${error}`);
    throw error;
  }
}

function zipLambdaFunction() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream("lambda-function.zip");
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.file("src/index.js", { name: "index.js" });
    archive.finalize();
  });
}

async function uploadToS3(bucketName, key) {
  const fileContent = fs.readFileSync("lambda-function.zip");
  await s3
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
    })
    .promise();
}

async function createOrUpdateLambda(bucketName, s3Key, roleArn) {
  const params = {
    FunctionName: "swaggerLambdaTest",
    Runtime: "nodejs18.x",
    Role: roleArn,
    Handler: "index.handler",
    Code: {
      S3Bucket: bucketName,
      S3Key: s3Key,
    },
  };

  try {
    await lambda
      .updateFunctionCode({
        FunctionName: "swaggerLambdaTest",
        S3Bucket: bucketName,
        S3Key: s3Key,
      })
      .promise();
    console.log("Lambda function updated");
  } catch (error) {
    if (error.code === "ResourceNotFoundException") {
      await lambda.createFunction(params).promise();
      console.log("Lambda function created");
    } else {
      throw error;
    }
  }
}

async function addPermissionToLambda() {
  const params = {
    Action: "lambda:InvokeFunction",
    FunctionName: "swaggerLambdaTest",
    Principal: "apigateway.amazonaws.com",
    StatementId: "AllowAPIGatewayInvoke",
    SourceArn: `arn:aws:execute-api:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:*/*/*/sample`,
  };

  try {
    await lambda.addPermission(params).promise();
    console.log("Permission added for API Gateway to invoke Lambda");
  } catch (error) {
    if (error.code === "ResourceConflictException") {
      console.log("Permission for API Gateway to invoke Lambda already exists");
    } else {
      throw error;
    }
  }
}

async function deployLambda() {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    await createBucketIfNotExists(bucketName);

    await zipLambdaFunction();

    const s3Key = "lambda-function.zip";
    await uploadToS3(bucketName, s3Key);

    const roleArn = await getRoleArn();
    await createOrUpdateLambda(bucketName, s3Key, roleArn);

    // Add permissions after creating/updating the Lambda function
    await addPermissionToLambda();

    console.log("Lambda function deployed successfully");
  } catch (error) {
    console.error("Error deploying Lambda:", error);
  }
}

deployLambda();
