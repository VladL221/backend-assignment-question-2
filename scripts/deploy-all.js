require("dotenv").config();
const { execSync } = require("child_process");

function runScript(scriptName) {
  console.log(`Running ${scriptName}...`);
  execSync(`node scripts/${scriptName}.js`, { stdio: "inherit" });
}

async function deployAll() {
  try {
    runScript("setup-iam");

    console.log("Waiting for IAM role to propagate...");
    await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds delay to let it propogate as need

    runScript("deploy-lambda");
    runScript("update-swagger");
    runScript("upload-swagger");
    runScript("import-api");
    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

deployAll();
