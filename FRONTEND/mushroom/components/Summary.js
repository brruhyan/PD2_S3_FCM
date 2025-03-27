import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View, Pressable, ImageBackground } from "react-native";
import { Inter_800ExtraBold, Inter_500Medium } from '@expo-google-fonts/inter';

function Summary({ inferenceResults }) {
  const [statusCounts, setStatusCounts] = useState({
    Ready: 0,
    "Not Ready": 0,
    Overdue: 0
  });
  const [totalMushrooms, setTotalMushrooms] = useState(0);

  useEffect(() => {
    if (inferenceResults && inferenceResults.length > 0) {  
      const counts = {
        Ready: 0,
        "Not Ready": 0,
        Overdue: 0
      };
  
      inferenceResults.forEach(detection => {
        if (detection?.class === "READY") {
          counts.Ready += 1;
        } else if (detection?.class === "NOT_READY") {
          counts['Not Ready'] += 1;
        } else if (detection?.class === "Overdue") {
          counts.Overdue += 1;
        }
      });
  
      setTotalMushrooms(inferenceResults.length);
      setStatusCounts(counts);
    } else {
      setTotalMushrooms(0);
      setStatusCounts({
        Ready: 0,
        "Not Ready": 0,
        Overdue: 0
      });
    }
  }, [inferenceResults]); 

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/Asset 2.png')}
        resizeMode='cover'
        style={styles.summaryBox}>
        <View style={styles.summaryContainer}>
          <Pressable style={[styles.detectedMushroomsContainer, styles.collapsed]}>
            <Text style={styles.detectedMushroomsCount}>{totalMushrooms}</Text>
            <Text style={styles.detectedMushroomsLabel}>Captured</Text>
            <Text style={styles.detectedMushroomsLabel}>Mushrooms</Text>
          </Pressable>

          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryItem}>
              <Text style={[styles.circle, styles.readyCircle]}>{statusCounts.Ready}</Text>
              <Text style={styles.summaryText}>Ready</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.circle, styles.notReadyCircle]}>{statusCounts['Not Ready']}</Text>
              <Text style={styles.summaryText}>Not Ready</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.circle, styles.overdueCircle]}>{statusCounts.Overdue}</Text>
              <Text style={styles.summaryText}>Overdue</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryBox: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    height: '65%',
    width: '90%',
    borderRadius: 15,
    marginBottom: 13,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 16,
    flexDirection: 'row',
  },

  detectedMushroomsContainer: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'white',
    overflow: 'hidden',
  },

  collapsed: {
    width: '40%',
    alignItems: 'center',
    padding: 10,
  },

  detectedMushroomsCount: {
    fontSize: 48,
    fontFamily: 'Inter_800ExtraBold',
    color: 'white',
  },

  detectedMushroomsLabel: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Inter_500Medium',
  },

  summaryTextContainer: {
    flex: 2,
    paddingLeft: 15,
  },

  summaryTitle: {
    fontSize: 24,
    color: '#C8E5D1',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  circle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    marginRight: 10,
    paddingVertical: 5,
  },

  readyCircle: {
    backgroundColor: '#48D38A',
  },

  notReadyCircle: {
    backgroundColor: '#FFCC00',
  },

  overdueCircle: {
    backgroundColor: '#FF5757',
  },

  summaryText: {
    fontSize: 20,
    color: '#C8E5D1',
  },

});

export default Summary;
