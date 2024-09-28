require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs").promises;
const path = require("path");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

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

async function uploadSwagger() {
  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    await createBucketIfNotExists(bucketName);

    const fileName = path.join(__dirname, "..", "swagger.json");
    let swaggerContent = await fs.readFile(fileName, "utf8");

    // Replace placeholders with actual values
    const lambdaArn = `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:swaggerLambdaTest`;
    swaggerContent = swaggerContent.replace(/\${LAMBDA_ARN}/g, lambdaArn);

    console.log("Updated Swagger content:", swaggerContent); // Add this line for debugging

    const params = {
      Bucket: bucketName,
      Key: "swagger.json",
      Body: swaggerContent,
    };

    const data = await s3.upload(params).promise();
    console.log(`Swagger file uploaded successfully. ${data.Location}`);
  } catch (error) {
    console.error("Error uploading Swagger file:", error);
  }
}

uploadSwagger();
