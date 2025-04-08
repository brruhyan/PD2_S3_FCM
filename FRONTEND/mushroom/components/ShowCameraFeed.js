import { StyleSheet, Text, Image, View, ActivityIndicator, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from 'react';
import axios from "axios";
import Svg, { Polygon } from 'react-native-svg';
import * as Notifications from 'expo-notifications';

function ShowCameraFeed({ onInferenceResults }) {
  const [imageData, setImageData] = useState('');
  const [loading, setLoading] = useState(false);
  const [inferenceData, setInferenceData] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const takePhoto = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://10.147.20.61:3000/takePhoto`); // Update with correct IP (local)
  
      if (response.status === 200) {
        const { image, inferenceResults } = response.data;
  
        // Include the image data along with inference results
        setImageData(image);
  
        const timestampedInferenceResults = inferenceResults.predictions.map(prediction => ({
          ...prediction,
          image: image,
          timestamp: new Date().toISOString(),
        }));
  
        setInferenceData({ image, predictions: timestampedInferenceResults });
  
        onInferenceResults(timestampedInferenceResults); // Pass the results to parent
  
      } else {
        console.error('Failed to take photo');
      }
    } catch (error) {
      console.error('Error: ', error);
    } finally {
      setLoading(false);
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

  const onImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
    console.log('Container dimensions:', width, height); 
  };

  const getClassStyles = (predictionClass) => {
    switch (predictionClass) {
      case 'READY':
        return { borderColor: '#48D38A', backgroundColor: '#48D38A' };
      case 'NOT_READY':
        return { borderColor: '#FFD700', backgroundColor: '#FFD700' };
      case 'Overdue':
        return { borderColor: '#FF0000', backgroundColor: '#FF0000' };
      default:
        return { borderColor: '#000000', backgroundColor: '#000000' };
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cameraFeedPressable} onPress={takePhoto}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.ShowCameraFeedText}>Scan</Text>
        )}
      </TouchableOpacity>

      {imageData ? (
        <View style={styles.cameraFeedContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${imageData}` }}
              style={styles.image}
              resizeMode="contain" 
              onLayout={onImageLayout}
            />

            {inferenceData?.predictions?.map((prediction, index) => {
              const scaled = scaleCoordinates(
                prediction,
                containerSize.width,
                containerSize.height
              );

              const stylesForClass = getClassStyles(prediction.class);

              return (
                <React.Fragment key={prediction.detection_id}>
                  <Svg
                    height={containerSize.height}
                    width={containerSize.width}
                    style={{ position: 'absolute', top: 0, left: 0 }} 
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
                    style={{
                      position: 'absolute',
                      left: scaled.points[0]?.x, 
                      top: scaled.points[0]?.y - 20, 
                      backgroundColor: stylesForClass.backgroundColor,
                      color: '#fff',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 5,
                      fontSize: 12,
                    }}
                  >
                    {prediction.class}
                  </Text>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.squareContainer}></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  cameraFeedPressable: {
    backgroundColor: '#15412D',
    borderRadius: 25,
    width: '90%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ShowCameraFeedText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  cameraFeedContainer: {
    width: '90%',
    aspectRatio: 4 / 3,
    borderRadius: 15,
    marginTop: 10,
    overflow: 'hidden',
  },
  squareContainer: {
    width: '90%',
    aspectRatio: 4 / 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginTop: 10,
  },
});

export default ShowCameraFeed;
