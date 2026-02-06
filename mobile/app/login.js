import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { api, API_ENDPOINTS } from '../config/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const netState = await NetInfo.fetch();
    
    if (netState.isConnected) {
      // Online: Firebase authentication
      try {
        // Try to sign in with Firebase
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError) {
          // If user doesn't exist, create a new account
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
          } else {
            throw signInError;
          }
        }

        const user = userCredential.user;
        
        // Sync with backend
        try {
          const response = await api.post(API_ENDPOINTS.AUTH.CREATE_OR_UPDATE_STUDENT, {
            firebaseUid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            profilePhoto: user.photoURL || null,
          });

          if (response.data.success) {
            // Save user data locally for offline access
            await AsyncStorage.setItem('userEmail', email);
            await AsyncStorage.setItem('firebaseUid', user.uid);
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
            
            console.log('Login successful:', response.data.data);
            router.replace('/dashboard');
          } else {
            Alert.alert('Error', 'Failed to sync with server');
          }
        } catch (apiError) {
          console.error('Backend sync error:', apiError);
          console.error('API Error details:', {
            message: apiError.message,
            code: apiError.code,
            url: apiError.config?.url,
            baseURL: apiError.config?.baseURL,
          });
          // Even if backend fails, we can still proceed with Firebase auth
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('firebaseUid', user.uid);
          Alert.alert('Warning', 'Logged in but backend sync failed. You may have limited functionality.');
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed';
        
        if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'User not found';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters';
        } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email already in use';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } else {
      // Offline: check local credentials
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedUid = await AsyncStorage.getItem('firebaseUid');
      
      if (email === savedEmail && savedUid) {
        router.replace('/dashboard');
      } else {
        Alert.alert('Error', 'Offline login failed. Please login online at least once.');
      }
    }
    
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.container}>
          <Text style={styles.title}>Money Council</Text>
          <Text style={styles.subtitle}>Budget Tracker</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.light.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.light.mutedForeground}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.light.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: Colors.light.background,
  },
  title: { 
    fontSize: 36, 
    fontWeight: '700', 
    color: Colors.light.primary, 
    marginBottom: 8, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: Colors.light.mutedForeground, 
    marginBottom: 48, 
    textAlign: 'center',
    fontWeight: '500',
  },
  input: { 
    backgroundColor: Colors.light.card, 
    borderColor: Colors.light.border, 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 16, 
    color: Colors.light.foreground, 
    marginBottom: 16,
    fontSize: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  button: { 
    backgroundColor: Colors.light.primary, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { 
    color: Colors.light.primaryForeground, 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.3,
  },
});