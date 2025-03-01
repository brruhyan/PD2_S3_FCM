import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';  
import { InferenceResultsProvider } from './contexts/InferenceResultsContext';
import { UserProvider } from './contexts/UserContext';
import NotificationScreen from './screens/NotificationScreen';
import { StatusBar } from "expo-status-bar";
import messaging from "@react-native-firebase/messaging";
import { ConstructionOutlined } from '@mui/icons-material';
import axios from 'axios';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ userEmail, setIsLoggedIn }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#15412D',
        tabBarInactiveTintColor: 'gray',
      }}
      initialRouteName="Home"
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      >
        {props => <ProfileScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
      <Tab.Screen
        name="Notification Logs"
        component={NotificationScreen}
        options={{
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainStackNavigator({ isLoggedIn, setIsLoggedIn }) {
  const [userEmail, setUserEmail] = useState('');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLogin={(email) => {
                  setIsLoggedIn(true);  
                  setUserEmail(email);  
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SignUp">
            {(props) => (
              <SignUpScreen
                {...props}
                onSignUp={(email) => {
                  setUserEmail(email);
                }}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="Main">
          {(props) => (
            <TabNavigator
              {...props}
              userEmail={userEmail}  
              setIsLoggedIn={setIsLoggedIn}  
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

// Main App component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const requestUserPermission = async () =>{
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled){
      console.log('Authorization Status', authStatus);
    }
  };

  // Send Token to Backend Server
  const sendTokenToServer = async (token) => {
    try {
      // Replace this with WIFI IP Address
      const response = await axios.post('http://x.x.x.x:8000/api/store-token', { 
        token: token,
      });
  
      console.log('Token sent to server:', response.data);
    } catch (error) {
      console.error('Error sending token:', error);
    }
  };
  
  // Retrieve FCM Token
  useEffect(() => {
    if (requestUserPermission()){
      messaging()
      .getToken()
      .then((token) => {
        console.log('FCM Push Token', token);
        sendTokenToServer(token); // Send token to Raspberry Pi Backend
        
      });
    } else{
      console.log('Permission Granted', authStatus);
    }
  

    // Check Whether an Initial Notification is Available
    messaging()
     .getInitialNotification()
     .then(async(remoteMessage)=>{
      if(remoteMessage){
        console.log(
          "Notification Opened App from QUIT STATE",
          remoteMessage.notification
        );
      }
     });

     // Assume the Notification Contains a 'TYPE' Property
     messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notification Caused App to Open from Background',
        remoteMessage.notification
      );
    });

    // Receive notifications even if app is not foregrounded
    messaging().setBackgroundMessageHandler(async(remoteMessage) => {
      console.log('Messaging Handled in the Background', remoteMessage);
    });

    const unsubscribe = messaging().onMessage(async(remoteMessage) => {
      Alert.alert('Notification Received!', JSON.stringify(remoteMessage));
    });
    
    return unsubscribe;
  }, []);
    
  return (
    <UserProvider>
      <InferenceResultsProvider>
        <NavigationContainer>
          <MainStackNavigator
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}  
          />
        </NavigationContainer>
      </InferenceResultsProvider>
    </UserProvider>
  );
}
