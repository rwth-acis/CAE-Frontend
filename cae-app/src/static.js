
export default class Static {
}
// these ids are used for yjs room names
Static.FrontendSpaceId = 'frontend-modeling';
Static.MicroserviceSpaceId = 'microservice-modeling';
Static.ApplicationSpaceId = 'application-modeling';

// store the URL to the project management service, model persistence service and webhost (for widgets)
// this gets updated when using docker env variables
// and should not end with a "/"
Static.ProjectManagementServiceURL = '{CAE_BACKEND_URL}/project-management';
Static.WebhostURL = '{WEBHOST}';
Static.ModelPersistenceServiceURL = '{CAE_BACKEND_URL}/CAE';
// Yjs configuration
Static.YjsAddress = "{YJS_ADDRESS}";
Static.YjsResourcePath = "{YJS_RESOURCE_PATH}";

// URL where the deployed application can be seen
Static.DeploymentURL = "{DEPLOYMENT_URL}";
// name of the GitHub organization where the source code is hosted
Static.GitHubOrg = "{GIT_ORGANIZATION}";