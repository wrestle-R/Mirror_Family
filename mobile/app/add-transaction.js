import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api, API_ENDPOINTS } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

// Backend categories mapped
const expenseCategories = ['food', 'transportation', 'entertainment', 'shopping', 'utilities', 'rent', 'education', 'healthcare', 'subscriptions', 'groceries', 'dining_out', 'clothing', 'electronics', 'travel', 'fitness', 'personal_care', 'gifts_donations', 'insurance', 'other_expense'];
const incomeCategories = ['salary', 'allowance', 'freelance', 'scholarship', 'gift', 'refund', 'investment_return', 'other_income'];

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const isEdit = params.edit === 'true';

  const [description, setDescription] = useState(params.description || '');
  const [amount, setAmount] = useState(params.amount ? String(params.amount) : '');
  const [type, setType] = useState(params.type || 'expense');
  const [category, setCategory] = useState(params.category || 'other_expense');
  const [merchant, setMerchant] = useState(params.merchant || '');
  const [notes, setNotes] = useState(params.notes || '');
  const [paymentMethod, setPaymentMethod] = useState(params.paymentMethod || 'cash');
  const [loading, setLoading] = useState(false);
  const [scanningBill, setScanningBill] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const router = useRouter();

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  async function requestCameraPermission() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async function requestImagePickerPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async function handleTakePhoto() {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      await handleBillScan(result.assets[0]);
    }
  }

  async function handlePickImage() {
    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Photo library permission is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      await handleBillScan(result.assets[0]);
    }
  }

  async function handleBillScan(imageAsset) {
    setScanningBill(true);
    try {
      const firebaseUid = await AsyncStorage.getItem('firebaseUid');
      if (!firebaseUid) {
        Alert.alert('Error', 'Please login first');
        setScanningBill(false);
        return;
      }

      const imageUri = imageAsset.uri;
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

      // Create FormData for React Native
      const formData = new FormData();
      formData.append('firebaseUid', firebaseUid);
      formData.append('images', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      });

      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/transactions/import-bills`;
      
      console.log('Uploading image to:', apiUrl);
      console.log('Image URI:', imageUri);
      console.log('Filename:', filename);
      console.log('MIME Type:', mimeType);

      // Use fetch for better FormData handling in React Native
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          // Don't set Content-Type header - fetch will set it with proper boundary for FormData
        },
      });

      console.log('Upload response status:', response.status);
      const responseData = await response.json();
      console.log('Upload response:', responseData);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${responseData.message || ''}`);
      }

      if (responseData.success && responseData.data?.created?.length > 0) {
        const extracted = responseData.data.created[0];
        setAmount(extracted.amount?.toString() || '');
        setDescription(extracted.description || '');
        setCategory(extracted.category || 'other_expense');
        setMerchant(extracted.merchant || '');
        setNotes(extracted.notes || '');
        setPaymentMethod(extracted.paymentMethod || 'cash');
        setType(extracted.type || 'expense');
        Alert.alert('Success', 'Transaction details extracted from bill!');
      } else if (responseData.success) {
        Alert.alert('Info', 'Image uploaded but could not extract details. Please enter manually.');
      } else {
        throw new Error(responseData.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Bill scan error:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', 'Failed to scan bill. Please enter details manually or check your connection.');
    } finally {
      setScanningBill(false);
    }
  }

  async function handleSubmit() {
    if (!description || !amount) {
      Alert.alert('Error', 'Please fill description and amount');
      return;
    }

    setLoading(true);
    const netState = await NetInfo.fetch();
    
    try {
      const firebaseUid = await AsyncStorage.getItem('firebaseUid');
      if (!firebaseUid) {
        Alert.alert('Error', 'Please login first');
        setLoading(false);
        return;
      }

      const transactionData = {
        firebaseUid,
        type,
        amount: Number(amount),
        category,
        description,
        merchant: merchant || '',
        notes: notes || '',
        paymentMethod,
        date: new Date().toISOString(),
      };

      if (netState.isConnected) {
        // Online: sync with backend
        try {
          if (isEdit && params.transactionId) {
            await api.put(API_ENDPOINTS.TRANSACTIONS.UPDATE(params.transactionId), transactionData);
          } else {
            await api.post(API_ENDPOINTS.TRANSACTIONS.CREATE, transactionData);
          }
          
          // Save locally
          const localTransactions = await AsyncStorage.getItem('transactions');
          let transactions = localTransactions ? JSON.parse(localTransactions) : [];
          
          if (isEdit) {
            transactions = transactions.map(t => 
              t._id === params.transactionId ? { ...transactionData, _id: params.transactionId } : t
            );
          } else {
            transactions.push({ ...transactionData, _id: Date.now().toString() });
          }
          
          await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
          Alert.alert('Success', isEdit ? 'Transaction updated!' : 'Transaction added!');
          router.replace('/dashboard');
        } catch (error) {
          console.error('API error:', error);
          Alert.alert('Error', 'Failed to save transaction online. Saving locally...');
          await saveLocally(transactionData);
        }
      } else {
        // Offline: save locally
        await saveLocally(transactionData);
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  }

  async function saveLocally(transactionData) {
    const localTransactions = await AsyncStorage.getItem('transactions');
    let transactions = localTransactions ? JSON.parse(localTransactions) : [];
    
    const transactionId = isEdit && params.transactionId ? params.transactionId : Date.now().toString();
    const transaction = { ...transactionData, _id: transactionId, synced: false };
    
    if (isEdit) {
      transactions = transactions.map(t => t._id === transactionId ? transaction : t);
    } else {
      transactions.push(transaction);
    }
    
    await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Add to sync queue
    const queue = await AsyncStorage.getItem('unsyncedTransactions');
    const unsynced = queue ? JSON.parse(queue) : [];
    unsynced.push({ action: isEdit ? 'edit' : 'add', transaction });
    await AsyncStorage.setItem('unsyncedTransactions', JSON.stringify(unsynced));
    
    Alert.alert('Success', 'Transaction saved locally. Will sync when online.');
    router.replace('/dashboard');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</Text>
        
        {/* Bill Scanning Section */}
        {!isEdit && (
          <View style={styles.scanSection}>
            <Text style={styles.sectionTitle}>Scan Bill</Text>
            <View style={styles.scanButtons}>
              <TouchableOpacity 
                style={[styles.scanButton, scanningBill && styles.buttonDisabled]} 
                onPress={handleTakePhoto}
                disabled={scanningBill || loading}
              >
                <Text style={styles.scanButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.scanButton, scanningBill && styles.buttonDisabled]} 
                onPress={handlePickImage}
                disabled={scanningBill || loading}
              >
                <Text style={styles.scanButtonText}>🖼️ Pick Image</Text>
              </TouchableOpacity>
            </View>
            {scanningBill && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.scanningText}>Scanning bill...</Text>
              </View>
            )}
            {selectedImage && (
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            )}
          </View>
        )}

        {/* Transaction Type */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]} 
            onPress={() => {
              setType('expense');
              setCategory('other_expense');
            }}
            disabled={loading}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]} 
            onPress={() => {
              setType('income');
              setCategory('other_income');
            }}
            disabled={loading}
          >
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter description" 
          placeholderTextColor={Colors.secondary} 
          value={description} 
          onChangeText={setDescription}
          editable={!loading && !scanningBill}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter amount" 
          placeholderTextColor={Colors.secondary} 
          keyboardType="numeric" 
          value={amount} 
          onChangeText={setAmount}
          editable={!loading && !scanningBill}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryContainer}>
            {currentCategories.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.categoryButton, category === cat && styles.categoryButtonActive]} 
                onPress={() => setCategory(cat)}
                disabled={loading || scanningBill}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Merchant */}
        <Text style={styles.label}>Merchant (Optional)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter merchant name" 
          placeholderTextColor={Colors.secondary} 
          value={merchant} 
          onChangeText={setMerchant}
          editable={!loading && !scanningBill}
        />

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.paymentContainer}>
            {['cash', 'upi', 'debit_card', 'credit_card', 'net_banking', 'wallet', 'other'].map(method => (
              <TouchableOpacity 
                key={method} 
                style={[styles.paymentButton, paymentMethod === method && styles.paymentButtonActive]} 
                onPress={() => setPaymentMethod(method)}
                disabled={loading || scanningBill}
              >
                <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                  {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Notes */}
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Add notes" 
          placeholderTextColor={Colors.secondary} 
          multiline 
          numberOfLines={3} 
          value={notes} 
          onChangeText={setNotes}
          editable={!loading && !scanningBill}
        />

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, (loading || scanningBill) && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={loading || scanningBill}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark} />
          ) : (
            <Text style={styles.submitButtonText}>{isEdit ? 'Save Changes' : 'Add Transaction'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.dark },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.accent, marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.accent, marginBottom: 10 },
  scanSection: { marginBottom: 20, padding: 15, backgroundColor: Colors.primary + '10', borderRadius: 10, borderWidth: 1, borderColor: Colors.secondary + '30' },
  scanButtons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  scanButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.secondary, alignItems: 'center' },
  scanButtonText: { color: Colors.dark, fontWeight: '600', fontSize: 14 },
  scanningIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  scanningText: { color: Colors.primary, fontSize: 14 },
  previewImage: { width: '100%', height: 150, borderRadius: 10, marginTop: 10, resizeMode: 'cover' },
  label: { color: Colors.secondary, fontSize: 12, marginBottom: 5, marginLeft: 5, marginTop: 5 },
  input: { backgroundColor: Colors.primary + '20', borderColor: Colors.secondary, borderWidth: 1, borderRadius: 10, padding: 12, color: Colors.accent, marginBottom: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.primary + '20', borderColor: Colors.secondary, borderWidth: 1, alignItems: 'center' },
  typeButtonActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  typeText: { color: Colors.secondary, fontWeight: '600' },
  typeTextActive: { color: Colors.dark },
  categoryScroll: { marginBottom: 15 },
  categoryContainer: { flexDirection: 'row', gap: 8 },
  categoryButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary + '20', borderColor: Colors.secondary, borderWidth: 1 },
  categoryButtonActive: { backgroundColor: Colors.secondary },
  categoryText: { color: Colors.secondary, fontSize: 11 },
  categoryTextActive: { color: Colors.dark, fontWeight: '600' },
  paymentContainer: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  paymentButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary + '20', borderColor: Colors.secondary, borderWidth: 1 },
  paymentButtonActive: { backgroundColor: Colors.primary },
  paymentText: { color: Colors.secondary, fontSize: 11 },
  paymentTextActive: { color: Colors.dark, fontWeight: '600' },
  submitButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: Colors.dark, fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
});