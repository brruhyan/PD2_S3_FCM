import { StyleSheet, Text, Image, View, Pressable, Modal } from "react-native";
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Inter_100Thin, Inter_800ExtraBold, Inter_700Bold, Inter_900Black, Inter_500Medium } from '@expo-google-fonts/inter';
import { Quicksand_300Light, Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

function Header() {

  const [fontsLoaded] = useFonts({
    Inter_800ExtraBold,
    Inter_700Bold,
    Inter_900Black,
    Inter_100Thin,
    Inter_500Medium,
    Quicksand_300Light,
    Quicksand_700Bold,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer); 
  }, []);

  function pressUserHandler(){
    setModalVisible(true);
  }

  const formattedDate = currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.clockContainer}>
        <Text style={styles.clockTimeText}>{formattedTime}</Text>
        <Text style={styles.clockDateText}>{formattedDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  headerContainer: {
    marginBottom: 20,
  },
  
  clockContainer: {
    alignItems: 'center',
  },

  clockTimeText: {
    fontSize: 70,
    color: '#1c1c1c',
    fontFamily: 'Inter_800ExtraBold',
    marginBottom: -7,
  },

  clockDateText: {
    fontSize: 18,
    color: '#1c1c1c',
    fontFamily: 'Inter_500Medium',
  },
});

export default Header;
