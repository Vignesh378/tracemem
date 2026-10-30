export function getApiErrorMessage(error, service, baseVariable) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (!error.response) {
    return `Could not reach the ${service} service. Check ${baseVariable}, service availability, and CORS configuration.`;
  }

  return error.message || `${service} request failed`;
}
