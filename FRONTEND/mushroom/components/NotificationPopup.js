import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import Modal from 'react-native-modal';

const NotificationPopup = ({ title, message, isVisible, onClose }) => {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
        <Text style={{ marginVertical: 10 }}>{message}</Text>
        <Button title="OK" onPress={onClose} />
      </View>
    </Modal>
  );
};

const App = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Show Notification" onPress={() => setIsVisible(true)} />
      <NotificationPopup 
        title="Notification Received!" 
        message="You've successfully registered for notifications." 
        isVisible={isVisible} 
        onClose={() => setIsVisible(false)} 
      />
    </View>
  );
};

export default App;
