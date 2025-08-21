import * as React from 'react';
import { createNavigationContainerRef, createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyClassComponent from './login';
import HomeComponent from './home';
import { navigationRef } from '../services/api/navigation-service';
import CollectionComponent from './collection';
import PrinterComponent from './printer';
import PrinterDetail from './printer-detail';
import PrintPreview from './print-preview';
import Screenshot from './screenshot';

const Stack = createNativeStackNavigator();

function RootStack() {
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={MyClassComponent} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeComponent} options={{ headerShown: false }} />
            <Stack.Screen name="Collection" component={CollectionComponent} options={{ headerShown: false }} />
            <Stack.Screen name="Printer" component={PrinterComponent} options={{ headerShown: false }} />
            <Stack.Screen name="PrinterDetail" component={PrinterDetail} options={{ headerShown: false }} />
            <Stack.Screen name="PrintPreview" component={PrintPreview} options={{ headerShown: false }} />
            <Stack.Screen name="Screenshot" component={Screenshot} options={{ headerShown: false }} />
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
