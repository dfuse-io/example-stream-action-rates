import {ApiTokenInfo} from "./token-refresher";

export class ApiTokenLocalStorage {
  static get(): ApiTokenInfo | undefined {
    const expiresAt = localStorage.getItem("token_expires_at")
    const token = localStorage.getItem("token")

    if (expiresAt === null || token === null) {
      return undefined
    }
    return {
      token,
      expires_at: parseInt(expiresAt, 10)
    }
  }

  static set(apiTokenInfo: ApiTokenInfo) {
    localStorage.setItem("token", apiTokenInfo.token)
    localStorage.setItem("token_expires_at", apiTokenInfo.expires_at.toString())
  }
}