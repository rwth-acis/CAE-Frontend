
export default class Static {
}
// these ids are used for yjs room names
Static.FrontendSpaceId = 'frontend-modeling';
Static.MicroserviceSpaceId = 'microservice-modeling';
Static.ApplicationSpaceId = 'application-modeling';

// store the URL to the project management service
// this gets updated when using docker env variables
// and should not end with a "/"
Static.ProjectManagementServiceURL = '{CAE_BACKEND_URL}/project-management';
