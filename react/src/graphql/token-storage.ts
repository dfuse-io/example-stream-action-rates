import {ApiTokenInfo} from "./token-refresher";

export enum TOKEN_LOCAL_STORAGE_NAMES {
  EXPIRES_AT = "token_expires_at",
  TOKEN = "token"
}

export class ApiTokenLocalStorage {
  static get(): ApiTokenInfo | undefined {
    const expiresAt = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAMES.EXPIRES_AT)
    const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAMES.TOKEN)

    if (expiresAt === null || token === null) {
      return undefined
    }
    return {
      token,
      expires_at: parseInt(expiresAt, 10)
    }
  }

  static set(apiTokenInfo: ApiTokenInfo) {
    localStorage.setItem(TOKEN_LOCAL_STORAGE_NAMES.TOKEN, apiTokenInfo.token)
    localStorage.setItem(TOKEN_LOCAL_STORAGE_NAMES.EXPIRES_AT, apiTokenInfo.expires_at.toString())
  }
}