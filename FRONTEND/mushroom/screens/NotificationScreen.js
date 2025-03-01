import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useInferenceResults } from '../contexts/InferenceResultsContext';

const NotificationScreen = () => {
  const { inferenceResults } = useInferenceResults();
  const screenWidth = Dimensions.get('window').width;

  const readyMushroomDetections = inferenceResults
    .filter(result => result.class === 'Ready');

  const getClassStyles = (predictionClass) => {
    switch (predictionClass) {
      case 'Ready':
        return { borderColor: '#48D38A', backgroundColor: '#48D38A' };
      case 'Not-Ready':
        return { borderColor: '#FFD700', backgroundColor: '#FFD700' };
      case 'Overdue':
        return { borderColor: '#FF0000', backgroundColor: '#FF0000' };
      default:
        return { borderColor: '#000000', backgroundColor: '#000000' };
    }
  };

  const scaleCoordinates = (prediction, containerWidth, containerHeight) => {
    const originalWidth = 1024; // Camera's main resolution width
    const originalHeight = 768; // Camera's main resolution height

    const scaleX = containerWidth / originalWidth;
    const scaleY = containerHeight / originalHeight;

    return {
      points: prediction.points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      })),
    };
  };

  return (
    <ScrollView style={styles.container}>
      {readyMushroomDetections.length > 0 ? (
        readyMushroomDetections.map((result, index) => {
          const stylesForClass = getClassStyles(result.class);
          const containerWidth = screenWidth * 0.9;
          const containerHeight = containerWidth * (768 / 1024);

          const scaled = scaleCoordinates(
            result, 
            containerWidth, 
            containerHeight
          );

          return (
            <View key={index} style={styles.notificationContainer}>
              <Text style={styles.notificationText}>
                Mushroom detected that is ready to harvest
              </Text>
              <Text style={styles.timestampText}>
                {new Date(result.timestamp).toLocaleString()}
              </Text>
              
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${result.image}` }}
                  style={[styles.image, { 
                    width: containerWidth, 
                    height: containerHeight 
                  }]}
                  resizeMode="contain"
                />
                
                <Svg
                  height={containerHeight}
                  width={containerWidth}
                  style={styles.svgOverlay}
                >
                  <Polygon
                    points={scaled.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={stylesForClass.backgroundColor}
                    fillOpacity={0.5}
                    stroke={stylesForClass.borderColor}
                    strokeWidth="2"
                  />
                </Svg>

                <Text
                  style={[
                    styles.classLabel,
                    {
                      left: scaled.points[0]?.x, 
                      top: scaled.points[0]?.y - 20, 
                      backgroundColor: stylesForClass.backgroundColor,
                    }
                  ]}
                >
                  {result.class}
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.notificationText}>No ready mushrooms for harvest</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    top: 20,
    zIndex: 10,
    width: '95%',
  },
  notificationContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: '90%',
  },
  image: {
    borderRadius: 10,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  notificationText: {
    fontSize: 18,
    paddingHorizontal: 10,
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  classLabel: {
    position: 'absolute',
    color: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    fontSize: 12,
  },
});

export default NotificationScreen;