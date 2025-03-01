import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, ImageBackground } from 'react-native';  
import { useUser } from '../contexts/UserContext';
import { useNavigation } from '@react-navigation/native'; 

function ProfileScreen({ setIsLoggedIn }) {
  const { username, setUsername } = useUser(); 
  const { userEmail } = useUser();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation(); 

  const handleEditProfile = () => {
    setUsername(username); 
    alert('Profile updated successfully!');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);  // Update the login state
    alert('Signed out successfully!');
  };
  
  console.log("Profile Email: ", userEmail);  

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/Asset 2.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImage}>
            <Text style={styles.profileImageText}>{username.charAt(0)}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
        </View>
      </ImageBackground>
      <View style={styles.profileDetails}>
        <Text style={styles.detailsTitle}>Profile Details</Text>
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailText}>Username</Text>
        <TextInput
          style={styles.inputField}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
        />
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailText}>Email</Text>
        <Text> {userEmail} </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.button}
          onPress={handleEditProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ccc', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    marginVertical: 10,
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
  },
  profileDetails: {
    marginBottom: 10,
    justifyContent: 'center',
  },
  emailContainer: {
    justifyContent: 'center',
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: '#15412D',
    marginBottom: 10,
  },
  inputField: {
    fontSize: 16,
    borderRadius: 5,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Inter_500Medium',
  },
  detailContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    height: 40,
    borderRadius: 5,
  },
  actions: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#15412D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 10,
    width: '75%',
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#FF5757',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
  },
  backgroundImage: {
    flex: 0, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: 200,
    width: '100%',
    marginBottom: 20,
  }
});

export default ProfileScreen;
