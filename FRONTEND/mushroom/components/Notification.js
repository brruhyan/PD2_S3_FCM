import { StyleSheet, Text, View, Pressable, Modal, FlatList, TouchableOpacity } from "react-native";
import { useState } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

function NotificationContainer({ inferenceResults = [] }) {
  const [modalVisible, setModalVisible] = useState(false);

  function pressUserHandler() {
    setModalVisible(true);
  }

  function closeModalHandler() {
    setModalVisible(false);
  }

  function getCircleColor(status) {
    if (status.toLowerCase() === 'ready') return '#48D38A'; 
    if (status.toLowerCase() === 'overdue') return '#FF0000'; 
    if (status.toLowerCase() === 'not-ready') return '#FFD700'; 
    return '#ccc'; 
  }

  return (
    <View style={styles.notificationContainer}>
      <Pressable onPress={pressUserHandler}>
        <MaterialIcons name='notifications' size={30} color='#000000' style={styles.icon} />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModalHandler}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Notifications</Text>
              <TouchableOpacity onPress={closeModalHandler}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            {inferenceResults.length > 0 ? (
              <FlatList
                data={inferenceResults}
                keyExtractor={(item, index) => `inference-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <View style={[styles.circle, { backgroundColor: getCircleColor(item.class) }]} />
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationText}>
                        Detected: {item.class}
                      </Text>
                      <Text style={styles.timestampText}>
                        Confidence: {Math.round(item.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noDataText}>No notifications available</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    paddingHorizontal: 15,
    padding: 10,
  },
  icon: {
    textAlign: 'right',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    maxHeight: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', 
  },
  headerText: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    marginTop: -10,
    color: '#48D38A',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginRight: 15,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
  },
  timestampText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
});

export default NotificationContainer;
