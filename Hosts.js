import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert, useColorScheme} from 'react-native';
import { Button, FAB, List, Modal, PaperProvider, Portal, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {NavigationContainer, useRoute, useFocusEffect} from '@react-navigation/native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const Hosts = ({navigation}) => {
    const [host,    setHost] = useState([]);
    const [selectedHost, setSelectedHost] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editedHost, setEditedHost] = useState(null);
    const [addingHost, setAddingHost] = useState(false);

    const colorScheme = useColorScheme();

    const backgroundColor = colorScheme === 'dark' ? 'black' : 'white'



    useEffect(() => {
        AsyncStorage.getItem('host').then(res => {
            if(res){
                setSelectedHost(JSON.parse(res));
            }else{
                setSelectedHost([]);
            }
        })
    },[])

    useEffect(() => {
        const loadHost = async () => {
            try{
                const savedHosts = await AsyncStorage.getItem('hosts');
                if(savedHosts){
                    setHost(JSON.parse(savedHosts));

                }
            } catch (error) {
                console.log('Error al cargar los hosts '+error);
            }
        }

        loadHost();
    },[])


    const RenderLista = () => {
        return host.map(item => (
            <List.Item
                key={item.id} 
                title = {item.nombre} 
                description = {item.host}
                onPress={() => {
                    if(selectedHost.id == item.id){
                        setSelectedHost('');
                        Alert.alert('Mensaje', 'Desconectado');
                        AsyncStorage.removeItem('host');

                    }else{
                        setSelectedHost(item);
                        Alert.alert('Mensaje', 'Conectado');
                        AsyncStorage.setItem('host', JSON.stringify(item));
                        console.log(item);

                    }
                    
                }}
                onLongPress = {() => 
                    Alert.alert(
                        'Confirmacion',
                        'Eliminar bultos escaneados?',
                        [
                          {
                            text: 'Cancelar',
                            onPress:  () => console.log('Cancelado'),
                            style: 'cancel'
                          },
                          {
                            text: 'Eliminar',
                            onPress: () => eliminarHost(item)
                          }
                        ]
                      )
                }
                left = {props => <List.Icon {...props} color= {selectedHost.id === item.id ? 'green' : 'red'} icon = {selectedHost.id === item.id ? 'ethernet-cable' : 'ethernet-cable-off'} />} 
                right = {props =>
                <TouchableOpacity onPress={() => modificaHost(item)} style = {{justifyContent: 'center'}}>
                    <List.Icon {...props} icon = 'pencil' />
                </TouchableOpacity>
                
            }
            />
        ));
    }

    const eliminarHost = (h) => {
        if(selectedHost == h){
            Alert.alert('Error', 'No puede eliminar el host al que esta conectado');
            return; 
        }else{
            const updatedHosts = host.filter((item) => item.id !== h.id);
            setHost(updatedHosts);

            AsyncStorage.setItem('hosts', JSON.stringify(updatedHosts));
        }

    }

    const modificaHost = (host) => {
        if(host){
            if(host.nombre === selectedHost.nombre){
                Alert.alert('Atencion', 'No puede modificar un host al que esta conectado');
                return;
            }else{
                setEditedHost(host);
                setAddingHost(false);
            }
        }else{
            const newHost = {
                nombre: '',
                host: '',
                ruta: '',
                protocolo: '',
            }
            setEditedHost(newHost);
            setAddingHost(true);
        }

        setModalVisible(true);
    }

    const saveHost = async () => {
        if(addingHost){
            const newId = host.length+1;

            const newHost = {
                id: newId,
                nombre: editedHost.nombre,
                host: editedHost.host,
                ruta: editedHost.ruta,
                protocolo: editedHost.protocolo,
            }

            const updatedHosts = [...host, newHost];
            setHost(updatedHosts);

            try {
                await AsyncStorage.setItem('hosts', JSON.stringify(updatedHosts));
            } catch (error) {
                console.log('Error al guardar los hosts:', error);
            }
            
        }else{
            //Busco el host en la lista
            const index = host.findIndex((item) => item.id === editedHost.id);

            //Actualizo los valores 
            const updatedHost = [...host];
            updatedHost[index] = editedHost;
            setHost(updatedHost);

            try {
                await AsyncStorage.setItem('hosts', JSON.stringify(updatedHost));
            } catch (error) {
                console.log('Error al guardar los hosts:', error);
            }
        }

        //Reinicio los valores
        setModalVisible(false);
        setAddingHost(false);
        setEditedHost(null);
        
    }

    return(
        <View style = {{flex: 1, backgroundColor: '#FFF'}}>
            <View style = {{alignItems:'center'}}>
                <Text variant='titleLarge' style = {{marginTop: 12}}>Lista De Hosts</Text>
            </View>
            <View style = {{padding: 5}}>
                <List.Section>
                    <List.Accordion
                        title = 'Conexiones registradas'
                        left={props => <List.Icon {...props} icon = 'server' />}
                        expanded = {true}
                    >
                        {RenderLista()}
                    </List.Accordion>
                </List.Section>
            </View>
            
            <Portal>
                <Modal visible = {modalVisible} onDismiss = {() => setModalVisible(false)} style = {{padding: 20}}>
                    <View style = {{padding: 25, backgroundColor: '#FFF', borderRadius: 8}}>
                        <View style = {{alignItems:'center', marginBottom: 5}}>
                            <Text variant='titleLarge'>{addingHost ? 'Agregar Conexion' : 'Modificar Conexion'}</Text>
                        </View>
                        <TextInput
                            label='Nombre'
                            mode='outlined'
                            value={editedHost?.nombre}
                            style = {{marginBottom: 15}}
                            onChangeText = {(text) => setEditedHost({...editedHost, nombre: text})}
                        />

                        <TextInput
                            label='Host'
                            mode='outlined'
                            value={editedHost?.host}
                            style = {{marginBottom: 15}}
                            onChangeText = {(text) => setEditedHost({...editedHost, host: text})}
                        />
                        <TextInput
                            label='Ruta Proteo'
                            mode='outlined'
                            value={editedHost?.ruta}
                            style = {{marginBottom: 15}}
                            onChangeText = {(text) => setEditedHost({...editedHost, ruta: text})}
                        />

                        <View style={{ elevation: 1, marginBottom: 15, borderBottomWidth: 1, borderColor: 'grey', borderRadius: 1 }}>
                            <Picker
                            style = {{height: 48}}
                            selectedValue={editedHost?.protocolo}
                            mode = 'dropdown'
                            onValueChange={(value) => setEditedHost({...editedHost, protocolo: value})}>
                                <Picker.Item label='Seleccione un protocolo'  value=''  />
                                <Picker.Item label='HTTP'  value='http://'  />
                                <Picker.Item label='HTTPS' value='https://' />
                            </Picker>
                        </View> 
                        <Button mode='contained' onPress={saveHost}>
                            Guardar
                        </Button>
                    </View>
                </Modal>
            </Portal>
            
            <FAB
                icon='plus'
                style = {styles.fab}
                onPress = {() => modificaHost()}
                variant = 'surface'
                />
        </View>
        
    )
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0
    }
}) 