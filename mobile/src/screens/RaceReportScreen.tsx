import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RaceReport } from '../types';

export default function RaceReportScreen({ route, navigation }: any) {
  const report: RaceReport = route?.params?.report;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{report.title || 'Untitled Report'}</Text>
        <Text style={styles.meta}>Race: {report.race_name || 'Unknown Race'}</Text>
        <Text style={styles.meta}>By: {report.author || 'Unknown Author'}</Text>
        <Text style={styles.meta}>Date: {new Date(report.created_at).toLocaleDateString()}</Text>
        <View style={styles.separator} />
        <Text style={styles.body}>{(report.content && report.content.trim()) || (report.content_md && report.content_md.trim()) || 'No content available'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});

 


