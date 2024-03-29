// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */
import type { BaseTranslation as BaseTranslationType, LocalizedString, RequiredParams } from "typesafe-i18n";

export type BaseTranslation = BaseTranslationType;
export type BaseLocale = "en";

export type Locales = "de" | "en";

export type Translation = RootTranslation;

export type Translations = RootTranslation;

type RootTranslation = {
    commands: {
        auth: {
            /**
             * a​u​t​h
             */
            name: string;
            /**
             * A​u​t​h​e​n​t​i​c​a​t​e​ ​o​n​ ​t​h​i​s​ ​s​e​r​v​e​r​ ​u​s​i​n​g​ ​y​o​u​r​ ​A​P​I​ ​k​e​y​.
             */
            description: string;
            opt: {
                api_key: {
                    /**
                     * Y​o​u​r​ ​G​u​i​l​d​W​a​r​s​2​ ​A​P​I​ ​K​e​y
                     */
                    description: string;
                };
            };
        };
    };
    /**
     * H​i​ ​{​n​a​m​e​}​!​ ​P​l​e​a​s​e​ ​l​e​a​v​e​ ​a​ ​s​t​a​r​ ​i​f​ ​y​o​u​ ​l​i​k​e​ ​t​h​i​s​ ​p​r​o​j​e​c​t​:​ ​h​t​t​p​s​:​/​/​g​i​t​h​u​b​.​c​o​m​/​i​v​a​n​h​o​f​e​r​/​t​y​p​e​s​a​f​e​-​i​1​8​n
     * @param {string} name
     */
    HI: RequiredParams<"name">;
};

export type TranslationFunctions = {
    commands: {
        auth: {
            /**
             * auth
             */
            name: () => LocalizedString;
            /**
             * Authenticate on this server using your API key.
             */
            description: () => LocalizedString;
            opt: {
                api_key: {
                    /**
                     * Your GuildWars2 API Key
                     */
                    description: () => LocalizedString;
                };
            };
        };
    };
    /**
     * Hi {name}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n
     */
    HI: (arg: { name: string }) => LocalizedString;
};

export type Formatters = {};
