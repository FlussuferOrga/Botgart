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
  RosterInformation,
} from '../models/index.js';
import {
    ErrorResponseFromJSON,
    ErrorResponseToJSON,
    RosterInformationFromJSON,
    RosterInformationToJSON,
} from '../models/index.js';

export interface UpdateRosterRequest {
    rosterInformation: RosterInformation;
}

/**
 * ResetrosterApi - interface
 * 
 * @export
 * @interface ResetrosterApiInterface
 */
export interface ResetrosterApiInterface {
    /**
     * 
     * @summary Update Roster Information
     * @param {RosterInformation} rosterInformation 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ResetrosterApiInterface
     */
    updateRosterRaw(requestParameters: UpdateRosterRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>>;

    /**
     * Update Roster Information
     */
    updateRoster(requestParameters: UpdateRosterRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string>;

}

/**
 * 
 */
export class ResetrosterApi extends runtime.BaseAPI implements ResetrosterApiInterface {

    /**
     * Update Roster Information
     */
    async updateRosterRaw(requestParameters: UpdateRosterRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>> {
        if (requestParameters.rosterInformation === null || requestParameters.rosterInformation === undefined) {
            throw new runtime.RequiredError('rosterInformation','Required parameter requestParameters.rosterInformation was null or undefined when calling updateRoster.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/resetroster`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: RosterInformationToJSON(requestParameters.rosterInformation),
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<string>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     * Update Roster Information
     */
    async updateRoster(requestParameters: UpdateRosterRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string> {
        const response = await this.updateRosterRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
