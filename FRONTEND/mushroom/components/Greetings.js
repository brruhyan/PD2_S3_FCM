import { useState } from 'react';
import { Modal, Alert, Text, Pressable, StyleSheet, TextInput, Button, View} from "react-native";
import { useFonts } from 'expo-font';
import { Inter_800ExtraBold, Inter_300Light, Inter_400Regular, Inter_700Bold, Inter_500Medium, Inter_600SemiBold, Inter_900Black, Inter_100Thin } from '@expo-google-fonts/inter';
import { Quicksand_300Light, Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import { useUser } from '../contexts/UserContext';

function Greetings(props){
    const { username } = useUser();

    const [fontsLoaded] = useFonts({
        Inter_800ExtraBold,
        Inter_700Bold,
        Inter_900Black,
        Inter_100Thin,
        Quicksand_300Light,
        Quicksand_700Bold,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_300Light,
        Inter_400Regular

      });

    function getGreeting() {
        const currentHour = new Date().getHours();
        if(currentHour < 12) {
            return 'Good morning';
        } else if (currentHour < 18) {
            return 'Good afternoon';
        } else {
            return 'Good evening';
        }
    }

    return(
        <View style={styles.greetingsContainer}>
            <Text style={styles.greetingsText}>{getGreeting()}, {username || 'User'}!</Text>
            <Text style={styles.welcomeText}>Welcome to your farm.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    greetingsContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'left',
        paddingHorizontal: 15,

      },

    greetingsText: {
        fontSize: 22,
        fontFamily: 'Inter_600SemiBold'
    },

    welcomeText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        paddingVertical: 3, 
    },
})

export default Greetings;