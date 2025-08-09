import AsyncStorage from '@react-native-async-storage/async-storage';

export async function post(url: string, body: any | null, isHeader: boolean = false) {
    try {
        let accessToken = '';
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (token) accessToken = token;
        } catch {
            console.error('Something went wrong while retrieving access token');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (isHeader) {
            headers['Authorization'] = accessToken;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        return await response.json();
    } catch (error) {
        console.error('POST request failed', error);
        throw error;
    }
}

export async function get(url: string, isHeader: boolean = true) {
    try {
        let accessToken = '';
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (token) accessToken = token;
        } catch {
            console.error('Something went wrong while retrieving access token');
        }

        const headers: Record<string, string> = {};
        if (isHeader) {
            headers['Authorization'] = accessToken;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        return await response.json();
    } catch (error) {
        console.error('GET request failed', error);
        throw error;
    }
}
