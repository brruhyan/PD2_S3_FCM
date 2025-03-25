// Frontend Libraries
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

// Notification Libraries
import messaging from "@react-native-firebase/messaging";
import axios from 'axios';

// AWS Libraries
import AWS from 'aws-sdk';
const s3 = new AWS.S3({
  accessKeyId: "x",
  secretAccessKey: "x,
  region: "ap-southeast-1"
});

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
  
  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled){
      console.log('Authorization Status', authStatus);
    }
  };
  
  /* To be Implemented - Upload a unique token to the tokens folder in s3 bucket for each device.
  const uploadTokenToS3 = async (token) => {
    const uniqueKey = `tokens/${token}.json`;

    const params = {
        Bucket: "projectdesign-mushroom-bucket",
        Key: uniqueKey,
        Body: JSON.stringify({ token }),
        ContentType: "application/json",
    };

    try {
        await s3.upload(params).promise();
        console.log("Token uploaded to S3 successfully:", uniqueKey);
    } catch (error) {
        console.error("Error uploading token to S3:", error);
    }
}; */

  // Function to upload FCM token to AWS S3
  const uploadTokenToS3 = async (token) => {
    const params = {
      Bucket: "x",
      Key: "tokens.json",
      Body: JSON.stringify({ token }),
      ContentType: "application/json",
  };

  try {
      await s3.upload(params).promise();
      console.log("Token uploaded to S3 successfully");
  } catch (error) {
      console.error("Error uploading token to S3:", error);
  }
};


  // Retrieve FCM Token and Handle Notifications
  useEffect(() => {
    if (requestUserPermission()){
      messaging()
      .getToken()
      .then((token) => {
        console.log('FCM Push Token', token);
        uploadTokenToS3(token); // Send token to S3 Bucket
      });
    } else{
      console.log('Permission Denied');
    }
  
    // Handle when a notification opens the app from a quit state
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification Opened App from QUIT STATE",
            remoteMessage.notification
          );
          Alert.alert(
            remoteMessage.notification?.title || "New Notification",
            remoteMessage.notification?.body || "You have a new message!"
          );
        }
      });

    // Handle when a notification opens the app from the background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notification Caused App to Open from Background',
        remoteMessage.notification
      );
      Alert.alert(
        remoteMessage.notification?.title || "New Notification",
        remoteMessage.notification?.body || "You have a new message!"
      );
    });

    // Handle foreground notifications (when app is open)
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert(
        remoteMessage.notification?.title || "New Notification",
        remoteMessage.notification?.body || "You have a new message!"
      );
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
