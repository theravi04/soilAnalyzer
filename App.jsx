import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import axios from 'axios';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getTokens} from './src/utils/tokenStorage';
import HomeScreen from './src/HomeScreen';
import ChatScreen from './src/ChatScreen';
import DoubtScreen from './src/DoubtScreen';
import ProfileScreen from './src/ProfileScreen';
import PinLogInScreen from './src/PinLogInScreen';
import SignUpScreen from './src/SignUpScreen';
import PasswordLogInScreen from './src/PasswordLogInScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

const BASE_URL = 'https://soilanalyzerserver.onrender.com';

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={PasswordLogInScreen} />
      <Stack.Screen name="Register" component={SignUpScreen} />
      <Stack.Screen name="PinLogIn" component={PinLogInScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Chat') iconName = 'chat';
          else if (route.name === 'Doubt') iconName = 'help-outline';
          else if (route.name === 'Profile') iconName = 'person';

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6600',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {backgroundColor: '#fff', bottom: 0, height: 60},
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Doubt" component={DoubtScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAppLaunch = async () => {
      try {
        const {pinToken, passwordToken} = await getTokens();
        console.log("pinToken check:", pinToken);
        console.log("passwordToken check:", passwordToken);
        
        if (passwordToken) {
          try {
            const response = await axios.post(
              `${BASE_URL}/user/validate-token/password`,
              {token: passwordToken},
            );
            if (response.status === 200) {
              setIsAuthenticated(true);
              
              // Check if PIN is set
              if (pinToken) {
                try {
                  const pinResponse = await axios.post(
                    `${BASE_URL}/user/validate-token/pin`,
                    {token: pinToken},
                  );
                  if (pinResponse.status === 200) {
                    setIsPinSet(true);
                  }
                } catch {
                  console.log('PIN token invalid.');
                }
              }
              
              setIsLoading(false);
              return;
            }
          } catch {
            console.log('Password token invalid.');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error during authentication check:', error);
        setIsLoading(false);
      }
    };
    
    handleAppLaunch();
  }, []);

  useEffect(() => {
    console.log('Authentication Check:', {
      isAuthenticated,
      isPinSet,
    });
  }, [isAuthenticated, isPinSet]);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && isPinSet ? (
          // Completely authenticated with PIN set
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : isAuthenticated && !isPinSet ? (
          // Authenticated but PIN not set
          <Stack.Screen name="PinLogIn" component={PinLogInScreen} />
        ) : (
          // Not authenticated
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}