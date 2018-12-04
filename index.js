/**
 * A basic ES6 API class that wraps the fetch function and allows
 * for a more dynamic and robust interface to interact with any
 *
 */
class API {
  constructor(hostUrl, endpoints, responseType) {
    try {
      this.hostUrl = hostUrl;
      this.endpoints = this.validateEndpoints(endpoints);
      this.responseType = responseType;
    } catch(error) {
      console.error(error);
    }
  }

  /**
   * Returns a promise that the developer can use to handle
   * a success or error with
   *
   * @method fetch
   *
   * @param  {String} method
   * @param  {Object} endpoint
   * @param  {Object} options
   *
   * @return {Promise}
   */
  fetch(method, endpoint, options = {}) {
    if (!this.validate(method, endpoint, options)) {
      return;
    }

    return new Promise(async (resolve, reject) => {
      const requestOptions = {};
      const request = this.buildRequest(method, endpoint, options);
      const response = await fetch(request);

      try {
        if (response.status < 200 || response.status > 299) {
          throw new Error(`Endpoint returned a ${response.status} status code`);
        }

        if (this.responseType === 'json') resolve(await response.json());
        if (this.responseType === 'text') resolve(await response.text());
        if (this.responseType === 'blob') resolve(await response.blob());
      } catch(error) {
        reject(error);
      }
    });
  }

  /**
   * Master builds the request object for use in a fetch() function
   *
   * @method buildRequest
   *
   * @param  {String} method
   * @param  {String} endpoint
   * @param  {Object} options
   *
   * @return {Request}
   */
  buildRequest(method, endpoint, options) {
    const payload = { method };
    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    let queryString = '';

    if (this.endpoints[endpoint].parent) {
      queryString += `/${this.endpoints[endpoint].parent}`;
    } else {
      queryString += `/${endpoint}`;
    }

    if (options.id) queryString += `/${options.id}`;
    if (this.endpoints[endpoint].parent) queryString += this.endpoints[endpoint].url;

    if (options.filter) {
      Object.keys(options.filter).forEach((filter, key) => {
        const value = options.filter[filter];
        const separator = key === 0 ? '?' : '&';

        queryString += `${separator}${filter}=${value}`;
      });
    }

    payload.headers = new Headers();
    payload.headers.set('Content-Type', this.getContentType());

    if (bodyMethods.indexOf(method.toUpperCase()) > -1) {
      payload.body = JSON.stringify(options);
    }

    return new Request(`${this.hostUrl}${encodeURI(queryString)}`, payload);
  }

  /**
   * Returns the content type associated with the respectful response type
   *
   * @method getContentType
   *
   * @return {String}
   */
  getContentType() {
    if (this.responseType === 'json') return 'application/json';
    if (this.responseType === 'text') return 'text/plain';
    if (this.responseType === 'blob') return 'text/plain';

    return 'application/json';
  }

  /**
   * Validates endpoints upon class construction
   *
   * @method validateEndpoints
   *
   * @param  {Object} endpoints
   *
   * @throws {Error}
   * @return {Object}
   */
  validateEndpoints(endpoints) {
    if (typeof endpoints !== 'object') {
      throw new Error('Endpoints must be an object');
    }

    Object.keys(endpoints).forEach((value) => {
      const endpoint = endpoints[value];

      if (!endpoint.url) {
        throw new Error(`Endpoint: '${value}' is missing the 'url' property`);
      }

      if (!endpoint.methods) {
        throw new Error(`Endpoint: '${value}' is missing the 'methods' property`);
      }
    });

    return endpoints;
  }

  /**
   * Executes all endpoint validation methods
   *
   * @method validate
   *
   * @param  {String} method
   * @param  {String} endpoint
   * @param  {Object} options
   *
   * @return {Bool}
   */
  validate(method, endpoint, options) {
    try {
      this.validateEndpoint(endpoint);
      this.validateMethod(method, endpoint);
      this.validatePayload(options);
    } catch(error) {
      console.error(error);

      return false;
    }

    return true;
  }

  /**
   * Validates the current endpoints request method
   *
   * @method validateMethod
   *
   * @param  {String} method
   * @param  {String} endpoint
   *
   * @throws {Error}
   */
  validateMethod(method, endpoint) {
    const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

    if (methods.indexOf(method.toUpperCase()) === -1) {
      throw new Error(`Endpoint method must be one of the following: ${methods.join(', ')}`);
    }

    if (this.endpoints[endpoint].methods.indexOf(method.toUpperCase()) === -1) {
      throw new Error(`The endpoint '${endpoint}'\'s method '${method}' was not found`);
    }
  }

  /**
   * Validates the current endpoint against this class
   *
   * @method validateEndpoint
   *
   * @param  {String} endpoint
   *
   * @throws {Error}
   */
  validateEndpoint(endpoint) {
    if (typeof this.endpoints[endpoint] === 'undefined') {
      throw new Error(`The endpoint '${endpoint}' does not exist`);
    }
  }

  /**
   * Validates the current endpoints payload options
   *
   * @method validatePayload
   *
   * @param  {Object} options
   *
   * @throws {Error}
   */
  validatePayload(options) {
    if (typeof options === 'undefined') {
      throw new Error('Endpoint payload must be an object');
    }
  }
}
