import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Alert, SafeAreaView } from 'react-native';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, Timestamp, orderBy } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Data
  const [events, setEvents] = useState<any[]>([]);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const q = query(
      collection(db, "events"),
      where("uid", "==", user.uid),
      // orderBy("start_at", "asc") // Requires index, might fail if not indexed. Let's sort client side or try.
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      // Client side sort
      list.sort((a, b) => a.start_at.localeCompare(b.start_at));
      setEvents(list);
    });

    return unsub;
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Error", "Please enter email and password");
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    if (!user) return;

    try {
      const now = new Date();
      const start = now.toISOString();
      const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // +1 hour

      await addDoc(collection(db, "events"), {
        uid: user.uid,
        calendar_id: "default",
        title: newTitle,
        description: newDesc,
        start_at: start, // Simple ISO string for now
        end_at: end,
        is_all_day: false,
        created_at: Timestamp.now(),
        color: "#3b82f6" // Default blue
      });
      setModalVisible(false);
      setNewTitle("");
      setNewDesc("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Calendar Suite</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Loading..." : (isRegistering ? "Register" : "Login")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3b82f6' }}>
            {isRegistering ? "Already have an account? Login" : "No account? Register"}
          </Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 20, color: '#888', fontSize: 12 }}>
          (Google Login is available on Web)
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{ color: 'red' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.colorBar, { backgroundColor: item.color || '#ccc' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTime}>
                {item.start_at?.slice(0, 10)} {item.start_at?.slice(11, 16)}
              </Text>
              {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>No events found.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>New Event</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Description"
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleAdd}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  btn: {
    width: '100%',
    padding: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    marginTop: -4,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
