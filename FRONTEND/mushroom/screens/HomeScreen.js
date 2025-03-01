import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import NotificationContainer from '../components/Notification';
import Header from '../components/Header';
import Greetings from '../components/Greetings';
import Summary from '../components/Summary';
import ShowCameraFeed from '../components/ShowCameraFeed';
import { useInferenceResults } from '../contexts/InferenceResultsContext'; 

function HomeScreen() {
  const { inferenceResults, updateInferenceResults } = useInferenceResults();

  return (
    <ScrollView style={styles.appContainer}>
      <View style={styles.notificationWrapper}>
        <NotificationContainer inferenceResults={inferenceResults} />
      </View>

      <Header />
      <Greetings />

      <View style={styles.summaryContainer}>
        <Summary inferenceResults={inferenceResults}/>
      </View>

      <View style={styles.showCameraFeedContainer}>
        <ShowCameraFeed onInferenceResults={updateInferenceResults} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: 15, 
  },

  notificationWrapper: {
    position: 'absolute',
    top: 20,
    right: 10,
    zIndex: 10,
  },

  summaryContainer: {
    width: '100%',
  },

  showCameraFeedContainer: {
    flexGrow: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 0,
  },
});

export default HomeScreen;
