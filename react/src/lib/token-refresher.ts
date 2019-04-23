import { ApiTokenLocalStorage } from "./token-storage";
import {ApiTokenInfo} from "./models";

/**
 * parseJwt: Extracts JSON data from the JWT token
**/
function parseJwt(token: string) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

/**
 * getToken: handles the token refresh,
 * only when it is expired, else use the token in local storage
**/
export async function getToken(apiKey: string): Promise<ApiTokenInfo> {
  const tokenInfo: ApiTokenInfo | undefined = ApiTokenLocalStorage.get()

  if(!tokenInfo) {
    return await getTokenFromServer(apiKey)
  }

  const jwt = parseJwt(tokenInfo.token);
  const expiration = jwt["exp"];
  const now = Date.now() / 1000;

  const remainingTime = expiration - now;

  console.log("Time remaining in second: " + remainingTime);
  if (remainingTime < 60 * 60) {
    return await getTokenFromServer(apiKey)
  }

  return tokenInfo
}

/** getTokenFromServer: fetch new token from backend using the dfuse api key **/
async function getTokenFromServer(apiKey: string): Promise<ApiTokenInfo> {
  const jsonBody = JSON.stringify({ api_key: apiKey })

  return fetch("https://auth.dfuse.io/v1/auth/issue", {  method: "POST", body: jsonBody })
    .then(async (response: Response) => {
      const tokenInfo = await response.json()
      ApiTokenLocalStorage.set(tokenInfo)
      return Promise.resolve(tokenInfo)
    })
}




