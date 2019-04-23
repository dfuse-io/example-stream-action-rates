import { ApiTokenLocalStorage } from "./token-storage";

function parseJwt (token: string) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

export async function getToken(apiKey: string): Promise<ApiTokenInfo> {
  const tokenInfo: ApiTokenInfo | undefined = ApiTokenLocalStorage.get()

  if(!tokenInfo) {
    return await getTokenFromServer(apiKey)
  }

  const jwt = parseJwt(tokenInfo.token);
  const exp = jwt["exp"];
  const now = Date.now() / 1000;

  console.log("exp  : " + exp);
  console.log("now  : " + now);
  const remainingTime = exp - now;

  console.log("Time remaining in second: " + remainingTime);
  if (remainingTime < 60 * 60) {
    return await getTokenFromServer(apiKey)
  }

  return tokenInfo
}


export interface ApiTokenInfo {
  token: string
  expires_at: number
}

async function getTokenFromServer(apiKey: string): Promise<ApiTokenInfo> {
  const url = "https://auth.dfuse.io/v1/auth/issue";
  const jsonBody = JSON.stringify({ api_key: apiKey })

  return fetch(url, {  method: "POST", body: jsonBody }).then(async (response: Response) => {
    const tokenInfo = await response.json()
    ApiTokenLocalStorage.set(tokenInfo)
    return Promise.resolve(tokenInfo)
  })
}




