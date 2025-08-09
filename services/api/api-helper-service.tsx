import { trim, trimEnd } from 'lodash';
import { get, post } from './api-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiUrl = 'https://staging.mobiledairy.co.in/';

export async function setAsyncStorage(key: string, val: string) {
  try {
    await AsyncStorage.setItem(key, val);
  } catch (error) {
    console.error('something went wrong while storing access token');
  }
};

export async function getAsyncStorage(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('something went wrong while storing access token');
  }
};

export function getApiUrl(path: string) {
    return generateUrlWithPath(apiUrl, path);
}

function generateUrlWithPath(url: string, path: string) {
    return `${trimEnd(url, "/")}/${trim(path, "/")}`;
}

export function loginUser(data: any) {
    const loginUrl = getApiUrl('api/auth_token');
    return post(loginUrl, data);
}

export function getProfile() {
  const loginUrl = getApiUrl('api/v3/profile/?src=web&lan=en');
  return get(loginUrl);
}

export function getCollectionsApi(reqObj: any) {
  const collectionUrl = getApiUrl(
    `api/v2/collection/?center=${reqObj?.center}&customer_info=${reqObj?.customer_info}&date=${reqObj?.date}
    ${reqObj?.shift ? ('&shift=' + reqObj?.shift) : ''}${reqObj?.type ? ('&type=' + reqObj?.type) : ''}&src=web&lan=en`
  );
  return get(collectionUrl);
}