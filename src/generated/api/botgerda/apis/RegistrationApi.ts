/* tslint:disable */
/* eslint-disable */
/**
 * ts-gw2-verifyBot
 * ts-gw2-verifyBot
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime.js';
import type {
  ErrorResponse,
  RegistrationDelete200Response,
  RegistrationDeleteRequest,
} from '../models/index.js';
import {
    ErrorResponseFromJSON,
    ErrorResponseToJSON,
    RegistrationDelete200ResponseFromJSON,
    RegistrationDelete200ResponseToJSON,
    RegistrationDeleteRequestFromJSON,
    RegistrationDeleteRequestToJSON,
} from '../models/index.js';

export interface RegistrationDeleteOperationRequest {
    registrationDeleteRequest: RegistrationDeleteRequest;
}

/**
 * RegistrationApi - interface
 * 
 * @export
 * @interface RegistrationApiInterface
 */
export interface RegistrationApiInterface {
    /**
     * 
     * @summary delete a registration for an account
     * @param {RegistrationDeleteRequest} registrationDeleteRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RegistrationApiInterface
     */
    registrationDeleteRaw(requestParameters: RegistrationDeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<RegistrationDelete200Response>>;

    /**
     * delete a registration for an account
     */
    registrationDelete(requestParameters: RegistrationDeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<RegistrationDelete200Response>;

}

/**
 * 
 */
export class RegistrationApi extends runtime.BaseAPI implements RegistrationApiInterface {

    /**
     * delete a registration for an account
     */
    async registrationDeleteRaw(requestParameters: RegistrationDeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<RegistrationDelete200Response>> {
        if (requestParameters.registrationDeleteRequest === null || requestParameters.registrationDeleteRequest === undefined) {
            throw new runtime.RequiredError('registrationDeleteRequest','Required parameter requestParameters.registrationDeleteRequest was null or undefined when calling registrationDelete.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/registration`,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
            body: RegistrationDeleteRequestToJSON(requestParameters.registrationDeleteRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => RegistrationDelete200ResponseFromJSON(jsonValue));
    }

    /**
     * delete a registration for an account
     */
    async registrationDelete(requestParameters: RegistrationDeleteOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<RegistrationDelete200Response> {
        const response = await this.registrationDeleteRaw(requestParameters, initOverrides);
        return await response.value();
    }

}