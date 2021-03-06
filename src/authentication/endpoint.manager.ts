// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.

import { Utilities } from '../helpers/utilities';
import { Storage, StorageType } from '../helpers/storage';

export const DefaultEndpoints = {
    Google: 'Google',
    Microsoft: 'Microsoft',
    Facebook: 'Facebook',
    AzureAD: 'AzureAD'
};

export interface IEndpoint {
    /**
     * Unique name for the Endpoint
     */
    provider?: string;

    /**
     * Registered OAuth ClientID
     */
    clientId?: string;

    /**
     * Base URL of the endpoint
     */
    baseUrl?: string;

    /**
     * URL segment for OAuth authorize endpoint.
     * The final authorize url is constructed as (baseUrl + '/' + authorizeUrl).
     */
    authorizeUrl?: string;

    /**
     * Registered OAuth redirect url.
     * Defaults to window.location.origin
     */
    redirectUrl?: string;

    /**
     * Optional token url to exchange a code with.
     * Not recommended if OAuth provider supports implicit flow.
     */
    tokenUrl?: string;

    /**
     * Registered OAuth scope.
     */
    scope?: string;

    /**
     * Resource paramater for the OAuth provider.
     */
    resource?: string;

    /**
     * Automatically generate a state? defaults to false.
     */
    state?: boolean;

    /**
     * Automatically generate a nonce? defaults to false.
     */
    nonce?: boolean;

    /**
     * OAuth responseType.
     */
    responseType?: string;

    /**
     * Additional '&' separated query parameters.
     */
    extraQueryParameters?: string;
}

/**
 * Helper for creating and registering OAuth Endpoints.
 */
export class EndpointManager extends Storage<IEndpoint> {
    /**
     * @constructor
    */
    constructor() {
        super('OAuth2Endpoints', StorageType.LocalStorage);
    }

    /**
     * Extends Storage's default add method.
     * Registers a new OAuth Endpoint.
     *
     * @param {string} provider Unique name for the registered OAuth Endpoint.
     * @param {object} config Valid Endpoint configuration.
     * @see {@link IEndpoint}.
     * @return {object} Returns the added endpoint.
     */
    add(provider: string, config: IEndpoint): IEndpoint {
        if (config.redirectUrl == null) {
            config.redirectUrl = window.location.origin;
        }
        config.provider = provider;
        return super.insert(provider, config);
    }

    /**
     * Register Google Implicit OAuth.
     * If overrides is left empty, the default scope is limited to basic profile information.
     *
     * @param {string} clientId ClientID for the Google App.
     * @param {object} config Valid Endpoint configuration to override the defaults.
     * @return {object} Returns the added endpoint.
     */
    registerGoogleAuth(clientId: string, overrides?: IEndpoint) {
        let defaults = <IEndpoint>{
            clientId: clientId,
            baseUrl: 'https://accounts.google.com',
            authorizeUrl: '/o/oauth2/v2/auth',
            resource: 'https://www.googleapis.com',
            responseType: 'token',
            scope: 'https://www.googleapis.com/auth/plus.me',
            state: true
        };

        let config = Utilities.extend({}, overrides, defaults);
        return this.add(DefaultEndpoints.Google, config);
    };

    /**
     * Register Microsoft Implicit OAuth.
     * If overrides is left empty, the default scope is limited to basic profile information.
     *
     * @param {string} clientId ClientID for the Microsoft App.
     * @param {object} config Valid Endpoint configuration to override the defaults.
     * @return {object} Returns the added endpoint.
     */
    registerMicrosoftAuth(clientId: string, overrides?: IEndpoint) {
        let defaults = <IEndpoint>{
            clientId: clientId,
            baseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0',
            authorizeUrl: '/authorize',
            responseType: 'token',
            scope: 'https://graph.microsoft.com/user.read',
            extraParameters: '&response_mode=fragment',
            nonce: true,
            state: true
        };

        let config = Utilities.extend({}, overrides, defaults);
        this.add(DefaultEndpoints.Microsoft, config);
    };

    /**
     * Register Facebook Implicit OAuth.
     * If overrides is left empty, the default scope is limited to basic profile information.
     *
     * @param {string} clientId ClientID for the Facebook App.
     * @param {object} config Valid Endpoint configuration to override the defaults.
     * @return {object} Returns the added endpoint.
     */
    registerFacebookAuth(clientId: string, overrides?: IEndpoint) {
        let defaults = <IEndpoint>{
            clientId: clientId,
            baseUrl: 'https://www.facebook.com',
            authorizeUrl: '/dialog/oauth',
            resource: 'https://graph.facebook.com',
            responseType: 'token',
            scope: 'public_profile',
            nonce: true,
            state: true
        };

        let config = Utilities.extend({}, overrides, defaults);
        this.add(DefaultEndpoints.Facebook, config);
    };

    /**
     * Register AzureAD Implicit OAuth.
     * If overrides is left empty, the default scope is limited to basic profile information.
     *
     * @param {string} clientId ClientID for the AzureAD App.
     * @param {string} tenant Tenant for the AzureAD App.
     * @param {object} config Valid Endpoint configuration to override the defaults.
     * @return {object} Returns the added endpoint.
     */
    registerAzureADAuth(clientId: string, tenant: string, overrides?: IEndpoint) {
        let defaults = <IEndpoint>{
            clientId: clientId,
            baseUrl: `https://login.windows.net/${tenant}`,
            authorizeUrl: '/oauth2/authorize',
            resource: 'https://graph.microsoft.com',
            responseType: 'token',
            nonce: true,
            state: true
        };

        let config = Utilities.extend({}, overrides, defaults);
        this.add(DefaultEndpoints.AzureAD, config);
    };

    /**
     * Helper to generate the OAuth login url.
     *
     * @param {object} config Valid Endpoint configuration.
     * @return {object} Returns the added endpoint.
     */
    static getLoginParams(endpointConfig: IEndpoint): {
        url: string,
        state: number
    } {
        let scope = (endpointConfig.scope) ? encodeURIComponent(endpointConfig.scope) : null;
        let resource = (endpointConfig.resource) ? encodeURIComponent(endpointConfig.resource) : null;
        let state = endpointConfig.state && EndpointManager._generateCryptoSafeRandom();
        let nonce = endpointConfig.nonce && EndpointManager._generateCryptoSafeRandom();

        let urlSegments = [
            'response_type=' + endpointConfig.responseType,
            'client_id=' + encodeURIComponent(endpointConfig.clientId),
            'redirect_uri=' + encodeURIComponent(endpointConfig.redirectUrl)
        ];

        if (scope) {
            urlSegments.push('scope=' + scope);
        }
        if (resource) {
            urlSegments.push('resource=' + resource);
        }
        if (state) {
            urlSegments.push('state=' + state);
        }
        if (nonce) {
            urlSegments.push('nonce=' + nonce);
        }
        if (endpointConfig.extraQueryParameters) {
            urlSegments.push(endpointConfig.extraQueryParameters);
        }

        return {
            url: endpointConfig.baseUrl + endpointConfig.authorizeUrl + '?' + urlSegments.join('&'),
            state: state
        };
    }

    private static _generateCryptoSafeRandom() {
        let random = new Uint32Array(1);
        if ('msCrypto' in window) {
            (<any>window).msCrypto.getRandomValues(random);
        }
        else if ('crypto' in window) {
            window.crypto.getRandomValues(random);
        }
        else {
            throw new Error('The platform doesn\'t support generation of Cryptographically Safe Randoms. Please disable the state flag and try again');
        }
        return random[0];
    }
}
