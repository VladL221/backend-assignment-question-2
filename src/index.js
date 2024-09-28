exports.handler = async (event) => {
  try {
    const response = {
      statusCode: 200,
      body: JSON.stringify("Hello from Lambda! dis works veri veri gud"),
    };
    return response;
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error"),
    };
  }
};
