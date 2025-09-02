import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const CommunityScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👥</Text>
          </View>
          
          <Text style={styles.title}>Community</Text>
          
          <Text style={styles.subtitle}>Coming Soon</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Connect with fellow runners, share race experiences, and discover the Houston running community.
            </Text>
            
            <Text style={styles.featuresTitle}>What's Coming:</Text>
            
            <View style={styles.featuresList}>
              <Text style={styles.feature}>• Race report highlights</Text>
              <Text style={styles.feature}>• Community polls and discussions</Text>
              <Text style={styles.feature}>• Running tips and advice</Text>
              <Text style={styles.feature}>• Local meetups and group runs</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  descriptionContainer: {
    maxWidth: 300,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default CommunityScreen;
