import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; 
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { Inter_800ExtraBold, Inter_500Medium } from '@expo-google-fonts/inter';

const SignUpScreen = ({ onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });


  const { setUserEmail } = useUser();
  const { setUsername } = useUser();
  const navigation = useNavigation();

  const handleSignUp = () => {
    setFieldErrors({ email: !email, password: !password });

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log('Signed up as: ' + user.email);
        onSignUp(user.email);
        setUserEmail(user.email);
        const usernameFromEmail = user.email.split('@')[0];
        setUsername(usernameFromEmail);

        // Show a success alert
        Alert.alert(
          'Success',
          'You have successfully registered!',
          [
            {
              text: 'OK',
              onPress: navigation.navigate('Login'),
            },
          ]
        );

        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  return (
    <LinearGradient colors={['#076639', '#202525']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior='padding'>
        <Text style={styles.text}>Sign Up</Text>
        
        <ScrollView contentContainerStyle={styles.whiteBox} keyboardShouldPersistTaps="handled">
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#B0B0B0"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#B0B0B0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>Email (Required)</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#B0B0B0"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>Password (Required)</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#B0B0B0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </Pressable>

          <View style={styles.backToLoginContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  whiteBox: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    padding: 30,
    width: '100%',
    paddingTop: 40,
    height: '85%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  text: {
    textAlign: 'center',
    top: 100,
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  inputText: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Inter_500Medium',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  input: {
    height: 40,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#15412D',
    height: 40,
    width: 350,
    borderRadius: 10,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 1,
    marginBottom: 10,
  },
  backToLoginContainer: {
    marginTop: 15,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#076639',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
