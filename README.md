# Swagger Lambda API Gateway Project

This project demonstrates the deployment of an AWS Lambda function and API Gateway using a Swagger definition.

## Prerequisites

Before you begin, ensure you have the following:

1. **Node.js and npm**: Install Node.js (version 14.x or later) and npm. Download from [nodejs.org](https://nodejs.org/).
2. **AWS Account**: You need an active AWS account.
3. **AWS Credentials**: Set up your AWS credentials with appropriate permissions to create and manage IAM roles, Lambda functions, S3 buckets, and API Gateway.

## Setup

1. Clone the repository:

   ```
   git clone <your-repo-url>
   cd <your-project-directory>
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```
   AWS_ACCESS_KEY_ID=<your-access-key>
   AWS_SECRET_ACCESS_KEY=<your-secret-key>
   AWS_REGION=<your-aws-region>
   AWS_ACCOUNT_ID=<your-aws-account-id>
   S3_BUCKET_NAME=<your-unique-bucket-name>
   ```

   Replace the placeholders with your actual AWS credentials and details.

4. Ensure you have a `swagger.json` file in the root directory of your project. This file should define your API structure.

5. Create a `src/index.js` file with your Lambda function code.

## Project Structure

- `scripts/`: Contains deployment scripts
  - `setup-iam.js`: Sets up IAM roles and policies
  - `deploy-lambda.js`: Deploys the Lambda function
  - `update-swagger.js`: Updates the Swagger file with correct ARNs
  - `upload-swagger.js`: Uploads the Swagger file to S3
  - `import-api.js`: Imports the API to API Gateway
  - `deploy-all.js`: Orchestrates the entire deployment process
- `src/`: Contains the Lambda function code
  - `index.js`: The main Lambda function
- `swagger.json`: API definition file
- `.env`: Environment variables (not tracked in git)
- `package.json`: Project dependencies and scripts

## Deployment

To deploy the project, run:

```
npm run deploy
```

## Order of Execution and Script Descriptions

The deployment process follows this order:

1. **setup-iam.js**:

   - Creates the IAM role for the Lambda function if it doesn't exist
   - Attaches necessary policies to the role
   - Creates an API Gateway policy if it doesn't exist
   - Adds a delay to allow for role propagation

2. **deploy-lambda.js**:

   - Creates an S3 bucket if it doesn't exist
   - Zips the Lambda function code
   - Uploads the zipped code to S3
   - Creates or updates the Lambda function
   - Adds permission for API Gateway to invoke the Lambda function

3. **update-swagger.js**:

   - Reads the `swagger.json` file
   - Updates the Lambda ARN in the Swagger definition
   - Writes the updated content back to `swagger.json`

4. **upload-swagger.js**:

   - Uploads the updated `swagger.json` file to the S3 bucket

5. **import-api.js**:
   - Checks if the Lambda function exists
   - Imports the Swagger definition from S3 to create a new API in API Gateway
   - Deploys the API to a 'prod' stage

The `deploy-all.js` script orchestrates this entire process by running each script in the correct order.

## After Deployment

After successful deployment, you will see an output with your API Gateway URL. You can use this URL to test your API.

## Troubleshooting

- If you encounter permission issues, ensure your AWS credentials have the necessary permissions.
- Check CloudWatch Logs for any Lambda function errors.
- Ensure your `swagger.json` file is correctly formatted and matches your API structure.

## Potential improvements

1. **Error Handling and Logging**:

   - Implement more robust error handling throughout all scripts.
   - Use a logging library like Winston for better log management.
   - Set up centralized logging with AWS CloudWatch Logs.

2. **Configuration Management**:

   - Use a configuration management library like `config` to manage different environments (dev, staging, prod).
   - Store sensitive information in AWS Secrets Manager instead of .env files.

3. **So much more that i dont want to list i will compress**
   - At the end of the day i got lazy and didnt bother making it to percetion since its time costly.
   - I could had resued the 2 first scripts of uploading files to s3 and retrieving files from s3 as an npm package and reuse the code (Not do it a seperate microservice since its pointless and just worst in performance).
   - There is so much more that could be done but i think its fine as it is for the assignment.
