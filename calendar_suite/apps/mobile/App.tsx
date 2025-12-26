import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Alert, SafeAreaView } from 'react-native';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Calendar } from 'react-native-calendars';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import DateTimePicker from '@react-native-community/datetimepicker';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Data
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [memos, setMemos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Modal (Create & Edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [itemType, setItemType] = useState<"event" | "task" | "memo">("event");

  // Time Picker State
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '788435475840-o2gk865hsl5tb0plg2lmpg38amiqcse9.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((error) => {
        Alert.alert("Login Error", error.message);
      });
    }
  }, [response]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setTasks([]);
      setMemos([]);
      return;
    }

    const qEvents = query(collection(db, "events"), where("uid", "==", user.uid));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, type: 'event', ...d.data() }));
      setEvents(list);
    });

    const qTasks = query(collection(db, "tasks"), where("uid", "==", user.uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, type: 'task', ...d.data() }));
      setTasks(list);
    });

    const qMemos = query(collection(db, "memos"), where("uid", "==", user.uid));
    const unsubMemos = onSnapshot(qMemos, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, type: 'memo', ...d.data() }));
      setMemos(list);
    });

    return () => {
      unsubEvents();
      unsubTasks();
      unsubMemos();
    };
  }, [user]);

  const markedDates = useMemo(() => {
    const marks: any = {};

    events.forEach(e => {
      const date = e.start_at?.slice(0, 10);
      if (date) marks[date] = { marked: true, dotColor: e.color || '#3b82f6' };
    });

    tasks.forEach(t => {
      const date = t.due_at?.slice(0, 10);
      if (date) {
        if (marks[date]) marks[date].dotColor = 'purple';
        else marks[date] = { marked: true, dotColor: '#10b981' };
      }
    });

    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#3b82f6' };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#3b82f6' };
    }

    return marks;
  }, [events, tasks, memos, selectedDate]);

  const dailyItems = useMemo(() => {
    const es = events.filter(e => e.start_at?.slice(0, 10) === selectedDate);
    const ts = tasks.filter(t => t.due_at?.slice(0, 10) === selectedDate);
    const ms = memos.filter(m => {
      if (!m.created_at) return false;
      const d = m.created_at.toDate().toISOString().slice(0, 10);
      return d === selectedDate;
    });

    return [...es, ...ts, ...ms].sort((a, b) => {
      return 0;
    });
  }, [events, tasks, memos, selectedDate]);

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title || "");
      setDesc(item.description || item.content || "");
      setItemType(item.type);
      if (item.type === 'event' && item.start_at) {
        setStartTime(new Date(item.start_at));
        setEndTime(new Date(item.end_at));
      }
    } else {
      setEditingItem(null);
      setTitle("");
      setDesc("");
      setItemType("event");
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const start = new Date(now);
      start.setHours(now.getHours() + 1);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      setStartTime(start);
      setEndTime(end);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (itemType !== 'memo' && !title.trim()) return;
    if (itemType === 'memo' && !desc.trim()) return;

    try {
      const data: any = {
        uid: user.uid,
        updated_at: Timestamp.now(),
      };

      if (itemType === 'event') {
        data.title = title;
        data.description = desc;

        const combineDateAndTime = (dateStr: string, timeDate: Date) => {
          const d = new Date(dateStr);
          d.setHours(timeDate.getHours());
          d.setMinutes(timeDate.getMinutes());
          return d.toISOString();
        };

        data.start_at = combineDateAndTime(selectedDate, startTime);
        data.end_at = combineDateAndTime(selectedDate, endTime);

        if (!editingItem) {
          data.calendar_id = "default";
          data.is_all_day = false;
          data.created_at = Timestamp.now();
          data.color = "#3b82f6";
        }
      } else if (itemType === 'task') {
        data.title = title;
        data.description = desc;
        if (!editingItem) {
          data.calendar_id = "default";
          data.due_at = `${selectedDate}T00:00:00.000Z`;
          data.status = "PENDING";
          data.created_at = Timestamp.now();
        }
      } else {
        // Memo
        data.content = desc;
        if (!editingItem) {
          data.created_at = Timestamp.now();
        }
      }

      if (editingItem) {
        const col = editingItem.type === 'event' ? "events" : editingItem.type === 'task' ? "tasks" : "memos";
        await updateDoc(doc(db, col, editingItem.id), data);
      } else {
        const col = itemType === 'event' ? "events" : itemType === 'task' ? "tasks" : "memos";
        await addDoc(collection(db, col), data);
      }

      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleToggleComplete = async (item: any) => {
    if (item.type !== 'task') return;
    try {
      const ref = doc(db, "tasks", item.id);
      await updateDoc(ref, {
        status: item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const col = item.type === 'event' ? "events" : item.type === 'task' ? "tasks" : "memos";
            await deleteDoc(doc(db, col, item.id));
            setModalVisible(false);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        }
      }
    ]);
  };

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

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
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

        <TouchableOpacity
          style={[styles.btn, { marginTop: 10, backgroundColor: '#db4437' }]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.btnText}>Login with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3b82f6' }}>
            {isRegistering ? "Already have an account? Login" : "No account? Register"}
          </Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Calendar</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={{ color: 'red' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#3b82f6',
          todayTextColor: '#3b82f6',
          arrowColor: '#3b82f6',
        }}
      />

      <View style={{ padding: 15, backgroundColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '600', color: '#555' }}>{selectedDate}</Text>
      </View>

      <FlatList
        data={dailyItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.type === 'task' ? handleToggleComplete(item) : openModal(item)}
            onLongPress={() => openModal(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.colorBar, {
              backgroundColor: item.type === 'event' ? (item.color || '#3b82f6') : item.type === 'task' ? '#10b981' : '#f59e0b'
            }]} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.type === 'task' && (
                  <Text style={{ fontSize: 16 }}>{item.status === 'COMPLETED' ? '☑' : '☐'}</Text>
                )}
                <Text style={[styles.cardTitle, item.status === 'COMPLETED' && { textDecorationLine: 'line-through', color: '#888' }]}>
                  {item.type === 'memo' ? (item.content || "Memo") : item.title}
                </Text>
              </View>
              <Text style={styles.cardTime}>
                {item.type === 'event'
                  ? (item.is_all_day ? "종일" : `${formatTime(item.start_at)} ~ ${formatTime(item.end_at)}`)
                  : item.type.toUpperCase()}
              </Text>
              {item.type !== 'memo' && item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No items for this day.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editingItem ? "Edit Item" : `New Item (${selectedDate})`}</Text>

          {!editingItem && (
            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#eee', borderRadius: 8, padding: 4 }}>
              {(['event', 'task', 'memo'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, itemType === t && styles.activeTab]}
                  onPress={() => setItemType(t)}
                >
                  <Text style={[styles.tabText, itemType === t && styles.activeTabText]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {itemType !== 'memo' && (
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
          )}

          {itemType === 'event' && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ marginBottom: 5, color: '#666' }}>Start Time</Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeBtn}>
                  <Text>{formatTime(startTime.toISOString())}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartPicker(false);
                      if (date) setStartTime(date);
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ marginBottom: 5, color: '#666' }}>End Time</Text>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeBtn}>
                  <Text>{formatTime(endTime.toISOString())}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndPicker(false);
                      if (date) setEndTime(date);
                    }}
                  />
                )}
              </View>
            </View>
          )}

          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder={itemType === 'memo' ? "Content" : "Description"}
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            {editingItem && (
              <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#ef4444' }]} onPress={() => handleDelete(editingItem)}>
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleSave}>
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
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  timeBtn: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
});
