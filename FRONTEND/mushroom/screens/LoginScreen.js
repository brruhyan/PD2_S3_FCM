import React, { useState } from 'react';
import { StyleSheet, Text, Image, View, TextInput, Pressable, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; 
import { auth, signInWithEmailAndPassword } from '../firebase';
import { useUser } from '../contexts/UserContext';

const LoginScreen = ({ onLogin }) => {
    const { setUserEmail } = useUser();
    const { setUsername } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigation = useNavigation(); 

    const handleLogin = () => {
        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                console.log('Logged in as: ' + user.email);
                setUserEmail(user.email);
                const usernameFromEmail = user.email.split('@')[0];
                setUsername(usernameFromEmail);
                onLogin(user.email); 
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };

    return (
        <LinearGradient colors={['#076639', '#202525']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <KeyboardAvoidingView style={styles.whiteBox} behavior='padding'>
                <Text style={styles.loginText}>Login</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#B0B0B0"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={text => setEmail(text)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#B0B0B0"
                        value={password}
                        onChangeText={text => setPassword(text)}
                        secureTextEntry
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttonContainer}>
                    <Pressable style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </Pressable>
                </View>
                <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account?{' '}</Text>
                    <TouchableOpacity onPress={handleSignUp}>
                        <Text style={styles.signUpLink}>Sign Up.</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#15412D',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    logo: {
        position: 'absolute',
        top: 70,
        width: 200,
        height: 150,
        marginBottom: 20, 
        resizeMode: 'contain',
    },
    inputContainer: {
        width: '85%',
        justifyContent: 'center',
        alignContent: 'center',
    },
    input: {
        backgroundColor: 'white',
        height: 65,
        borderRadius: 15,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 4,
        elevation: 8,
        marginTop: 20,
    },
    loginButton: {
        marginTop: 20,
        backgroundColor: '#15412D',
        height: 40,
        width: 350,
        borderRadius: 10,
        justifyContent: 'center', 
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    whiteBox: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '75%',
        backgroundColor: 'white',
        borderTopLeftRadius: 40,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 40,
    },
    signUpContainer: {
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 15,
    },
    signUpText: {
        fontSize: 16,
    },
    signUpLink: {
        textDecorationLine: 'underline',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 10,
    },
});
