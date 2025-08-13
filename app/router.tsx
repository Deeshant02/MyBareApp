import * as React from 'react';
import { createNavigationContainerRef, createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyClassComponent from './login';
import HomeComponent from './home';
import { navigationRef } from '../services/api/navigation-service';
import CollectionComponent from './collection';

const Stack = createNativeStackNavigator();

function RootStack() {
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={MyClassComponent} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeComponent} options={{ headerShown: false }} />
            <Stack.Screen name="Collection" component={CollectionComponent} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

export default function Router() {
    return (
        <NavigationContainer ref={navigationRef}>
            <RootStack />
        </NavigationContainer>
    );
}
